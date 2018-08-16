package serverCtx

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"time"

	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/models"

	"database/sql"
	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/apps"
	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/layout"
	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/pod"
	"git.paas.workslan/resource_optimization/dynamic_analysis/pkg/environment"

	"git.paas.workslan/resource_optimization/dynamic_analysis/pkg/detect"
	_ "github.com/go-sql-driver/mysql"
)

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
	found := make(map[int64]struct{})
	for _, e := range p {
		/* Enlist live pods in this environment */
		fs := recursiveInsert(s.Db, &e)
		for _, f := range fs {
			found[f] = struct{}{}
		}
	}
	s.Perfing = found
	log.Print("[Discovery] Found:", len(s.Perfing))
}

func mapIsLiveFlag(ps []*models.Pod, alive map[int64]struct{}) {
	for _, p := range ps {
		_, prs := alive[p.ID]
		p.IsLive = prs
	}
}

func recursiveInsert(db *sql.DB, p *detect.Subscription) []int64 {
	found := make([]int64, 0, 2)
	/* Maybe resoleved: XXX It doesn't update existing environ/pod! It is a bug XXX */
	/* XXX insert detect's lastseen for the update XXX */
	en := environ.Assign(db, &p.Env)
	for _, a := range p.Apps {
		an := app.Assign(db, &a.Name, &a.Seen)
		if an == nil {
			continue
		}
		l := layout.Assign(db, en, an)
		for _, p := range a.Pods {
			p := pod.Assign(db, &p.Name, *en.ID, *an.ID, l.Id, &p.Link, p.LastUpdate).ToResponse()
			found = append(found, p.ID)
		}
	}
	return found
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
