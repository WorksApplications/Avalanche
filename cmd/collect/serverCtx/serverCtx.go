package serverCtx

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"time"

	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/models"
	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/restapi/operations"
	middleware "github.com/go-openapi/runtime/middleware"

	"database/sql"
	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/apps"
	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/environments"
	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/layout"
	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/pod"
	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/snapshot"

	"git.paas.workslan/resource_optimization/dynamic_analysis/pkg/detect"
	_ "github.com/go-sql-driver/mysql"
)

type ServerCtx struct {
	Db      *sql.DB
	Detect  string /* detect address */
	Pvmount string
	Perfing []int64
}

func (s *ServerCtx) HealthzHandler(_ operations.HealthzParams) middleware.Responder {
	return operations.NewHealthzOK().WithPayload("Vaer sa godt")
}

func (s *ServerCtx) ListAvailablePods(_ operations.ListAvailablePodsParams) middleware.Responder {
	body := make([]*models.Pod, len(s.Perfing))
	for i, pfing := range s.Perfing {
		body[i] = pod.Describe(s.Db, pfing)
	}
	return operations.NewListAvailablePodsOK().WithPayload(body)
}

func (s *ServerCtx) GetAppsHandler(_ operations.GetAppsParams) middleware.Responder {
	body := app.ListNames(s.Db)
	return operations.NewGetAppsOK().WithPayload(body)
}

func (s *ServerCtx) DescribeAppHandler(params operations.DescribeAppParams) middleware.Responder {
	body := app.Describe(s.Db, &params.Appid)
	if body == nil {
		return operations.NewDescribeAppDefault(404).WithPayload(nil)
	}
	return operations.NewDescribeAppOK().WithPayload(body)
}

func (s *ServerCtx) GetEnvironmentsHandler(params operations.GetEnvironmentsParams) middleware.Responder {
	app := app.Describe(s.Db, &params.Appid)
	if app == nil {
		return operations.NewDescribeAppDefault(404).WithPayload(nil)
	}
	lays := layout.OfApp(s.Db, *app.ID)
	if len(lays) == 0 {
		return operations.NewDescribeAppDefault(404).WithPayload(nil)
	}
	body := make([]*models.Environment, len(lays))
	for _, l := range lays {
		body = append(body, environ.FromLayout(s.Db, l))
	}
	return operations.NewGetEnvironmentsOK().WithPayload(body)
}

func (s *ServerCtx) DescribeEnvironmentHandler(params operations.DescribeEnvironmentParams) middleware.Responder {
	app := app.Describe(s.Db, &params.Appid)
	env := environ.Get(s.Db, &params.Environment)
	if app == nil || env == nil {
		return operations.NewDescribeAppDefault(404).WithPayload(nil)
	}
	lays := layout.OfBoth(s.Db, *app.ID, *env.ID)
	if lays == nil {
		return operations.NewDescribeAppDefault(404).WithPayload(nil)
	}
	body := environ.FromLayout(s.Db, lays)
	return operations.NewDescribeEnvironmentOK().WithPayload(body)
}

func (s *ServerCtx) GetPodsHandler(params operations.GetPodsParams) middleware.Responder {
	app := app.Describe(s.Db, &params.Appid)
	env := environ.Get(s.Db, &params.Environment)
	if app == nil || env == nil {
		return operations.NewDescribeAppDefault(404).WithPayload(nil)
	}
	lays := layout.OfBoth(s.Db, *app.ID, *env.ID)
	if lays == nil {
		return operations.NewDescribeAppDefault(404).WithPayload(nil)
	}
	body := pod.FromLayout(s.Db, lays)
	return operations.NewGetPodsOK().WithPayload(body)
}

func (s *ServerCtx) DescribePodHandler(params operations.DescribePodParams) middleware.Responder {
	app := app.Describe(s.Db, &params.Appid)
	env := environ.Get(s.Db, &params.Environment)
	if app == nil || env == nil {
		return operations.NewDescribeAppDefault(404).WithPayload(nil)
	}
	lay := layout.OfBoth(s.Db, *app.ID, *env.ID)
	if lay == nil {
		return operations.NewDescribeAppDefault(404).WithPayload(nil)
	}
	body := pod.Get(s.Db, &params.Pod, lay.Id)
	return operations.NewDescribePodOK().WithPayload(body)
}

func (s *ServerCtx) NewSnapshotHandler(params operations.NewSnapshotParams) middleware.Responder {
	app := app.Describe(s.Db, &params.Appid)
	env := environ.Get(s.Db, &params.Environment)
	if app == nil || env == nil {
		return operations.NewDescribeAppDefault(404).WithPayload(nil)
	}
	lay := layout.OfBoth(s.Db, *app.ID, *env.ID)
	if lay == nil {
		return operations.NewDescribeAppDefault(404).WithPayload(nil)
	}
	pod := pod.Get(s.Db, &params.Pod, lay.Id)
	body := snapshot.New(&s.Pvmount, s.Db, pod, lay)
	return operations.NewNewSnapshotOK().WithPayload(&body)
}

func (s *ServerCtx) pull() {
	log.Printf("start to pull pods' information from %s", s.Detect)
	r, err := http.Get(s.Detect + "/subscription/")
	if err != nil {
		log.Println("Poll failed!")
		return
	}
	d, er2 := ioutil.ReadAll(r.Body)
	if er2 != nil {
		log.Println("Poll f-ed up!")
		return
	}
	defer r.Body.Close()

	var p []detect.Subscription
	err = json.Unmarshal(d, &p)
	if err != nil || er2 != nil {
		log.Println("Unmarshal failed!", err, er2)
		log.Printf("res: %+v", p)
		return
	}
	found := make([]int64, 16)
	for _, e := range p {
		f := recursiveInsert(s.Db, &e)
		found = append(found, f...)
	}
	s.Perfing = found
}

func (s *ServerCtx) PollPodInfo() {
	/* If the retrieving schedule is invoked by detect, the place to post new data is unknown on testing. */
	t := time.NewTicker(1 * time.Minute)
	once := make(chan int, 1)
	once <- 1
	go func() {
		for {
			select {
			case <-once:
				close(once)
				once = nil
				s.pull()
			case <-t.C:
				s.pull()
			}
		}
	}()
}

func recursiveInsert(db *sql.DB, p *detect.Subscription) []int64 {
	found := make([]int64, 4)
	/* BUG XXX It doesn't update existing environ/pod! It is a bug XXX */
	en := environ.Assign(db, &p.Env)
	for _, a := range p.Apps {
		an := app.Assign(db, &a.Name, &a.Seen)
		if an == nil {
			continue
		}
		l := layout.Assign(db, *en.ID, *an.ID)
		for _, p := range a.Pods {
			p := pod.Assign(db, &p.Name, *en.ID, *an.ID, l.Id, &p.Link)
			found = append(found, p.ID)
		}
	}
	return found
}

func (s *ServerCtx) InitHandle() {
	environ.InitTable(s.Db)
	layout.InitTable(s.Db)
	pod.InitTable(s.Db)
	app.InitTable(s.Db)
}
