package serverCtx

import (
	"fmt"
	"log"

	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/models"
	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/restapi/operations"
	middleware "github.com/go-openapi/runtime/middleware"

	"database/sql"
	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/apps"
	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/layout"
	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/pod"
	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/snapshot"
	"git.paas.workslan/resource_optimization/dynamic_analysis/pkg/environment"

	_ "github.com/go-sql-driver/mysql"
)

type ServerCtx struct {
	Db        *sql.DB
	Detect    string /* detect address */
	Extract   string /* extract address */
	Pvmount   string
	Temporald string
	Perfing   map[int64]struct{}
	IsMaster  bool

	Flamescope string
}

func (s *ServerCtx) HealthzHandler(_ operations.HealthzParams) middleware.Responder {
	return operations.NewHealthzOK().WithPayload("Vaer sa godt")
}

func (s *ServerCtx) ListAvailablePods(_ operations.ListAvailablePodsParams) middleware.Responder {
	body := make([]*models.Pod, 0)
	for pf, _ := range s.Perfing {
		p := pod.Describe(s.Db, pf)
		if p == nil {
			operations.NewDescribeAppDefault(503).WithPayload(nil)
		}
		r := p.ToResponse()
		r.App = *app.FromId(s.Db, p.AppId).Name
		r.Environment = *environ.FromId(s.Db, p.EnvId).Name

		sn := snapshot.FromPod(s.Db, r)
		ss := make([]*models.Snapshot, len(sn))
		for i, n := range sn {
			ss[i] = n.ToResponse(s.Db, s.Flamescope)
		}
		r.Snapshots = ss

		r.IsAlive = true
		body = append(body, r)
	}
	if len(body) == 0 {
		operations.NewDescribeAppDefault(404).WithPayload(nil)
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
	for _, e := range body.Environments {
		if e == nil {
			log.Print("[WARN] nil Environment is in body")
			continue
		}
		for _, p := range e.Pods {
			podDescriber(s, p)
		}
	}
	return operations.NewDescribeAppOK().WithPayload(body)
}

func (s *ServerCtx) GetEnvironmentsHandler(params operations.GetEnvironmentsParams) middleware.Responder {
	app := app.Get(s.Db, &params.Appid)
	if app == nil {
		return operations.NewDescribeAppDefault(404).WithPayload(nil)
	}
	lays := layout.OfApp(s.Db, app)
	if len(lays) == 0 {
		return operations.NewDescribeAppDefault(404).WithPayload(nil)
	}
	body := make([]*models.Environment, 0, len(lays))
	for _, l := range lays {
		k := environ.FromLayout(s.Db, l)
		for _, p := range k.Pods {
			podDescriber(s, p)
		}
		body = append(body, k)
	}
	return operations.NewGetEnvironmentsOK().WithPayload(body)
}

func (s *ServerCtx) DescribeEnvironmentHandler(params operations.DescribeEnvironmentParams) middleware.Responder {
	lay := layHelper(s.Db, &params.Appid, &params.Environment)
	if lay == nil {
		return operations.NewDescribeAppDefault(404).WithPayload(nil)
	}
	body := environ.FromLayout(s.Db, lay)
	for _, p := range body.Pods {
		podDescriber(s, p)
	}
	return operations.NewDescribeEnvironmentOK().WithPayload(body)
}

func (s *ServerCtx) GetPodsHandler(params operations.GetPodsParams) middleware.Responder {
	lay := layHelper(s.Db, &params.Appid, &params.Environment)
	if lay == nil {
		return operations.NewDescribeAppDefault(404).WithPayload(nil)
	}
	ps := pod.FromLayout(s.Db, lay)
	body := podHelper(s, ps)
	return operations.NewGetPodsOK().WithPayload(body)
}

func (s *ServerCtx) DescribePodHandler(params operations.DescribePodParams) middleware.Responder {
	lay := layHelper(s.Db, &params.Appid, &params.Environment) // validate XXX
	if lay == nil {
		return operations.NewDescribeAppDefault(404).WithPayload(nil)
	}
	body := pod.Get(s.Db, &params.Pod, lay.Id).ToResponse()
	podDescriber(s, body)
	return operations.NewDescribePodOK().WithPayload(body)
}

func layHelper(db *sql.DB, a *string, e *string) *layout.Layout {
	app := app.Describe(db, a)
	env := environ.Get(db, e)
	if app == nil || env == nil {
		return nil //operations.NewDescribeAppDefault(404).WithPayload(nil)
	}
	lay := layout.OfBoth(db, env, app)
	if lay == nil {
		return nil //operations.NewDescribeAppDefault(404).WithPayload(nil)
	}
	return lay
}

func envDescriber(db *sql.DB, lay *layout.Layout) *models.Environment {
	body := environ.FromLayout(db, lay)
	return body
}

func podDescriber(s *ServerCtx, pod *models.Pod) {
	sn := snapshot.FromPod(s.Db, pod)
	pod.Snapshots = make([]*models.Snapshot, len(sn))
	for i, n := range sn {
		pod.Snapshots[i] = n.ToResponse(s.Db, s.Flamescope)
	}
	_, pod.IsAlive = s.Perfing[pod.ID]
}

func podHelper(s *ServerCtx, ps []*pod.PodInternal) []*models.Pod {
	body := make([]*models.Pod, len(ps))
	for i, p := range ps {
		body[i] = p.ToResponse()
		podDescriber(s, body[i])
	}
	//mapIsAliveFlag(body, s.Perfing)
	return body
}

func (s *ServerCtx) NewSnapshotHandler(params operations.NewSnapshotParams) middleware.Responder {
	app := app.Describe(s.Db, &params.Appid)
	env := environ.Get(s.Db, &params.Environment)
	if app == nil || env == nil {
		emsg := fmt.Sprintf("app %+v or environment %+v is invalid", app, env)
		return operations.NewDescribeAppDefault(404).WithPayload(&models.Error{Message: &emsg})
	}
	lay := layout.OfBoth(s.Db, env, app)
	if lay == nil {
		emsg := fmt.Sprintf("ENOLAYOUT app %s is not deployed in environment %s", app.Name, env.Name)
		return operations.NewDescribeAppDefault(404).WithPayload(&models.Error{Message: &emsg})
	}
	pod := pod.Get(s.Db, &params.Pod, lay.Id).ToResponse()
	if pod == nil {
		emsg := fmt.Sprintf("ENOPOD %s couldn't found", params.Pod, "on", lay.Id)
		return operations.NewDescribeAppDefault(404).WithPayload(&models.Error{Message: &emsg})
	}
	body, err := snapshot.New(&s.Extract, &s.Pvmount, &s.Temporald, s.Db, app, pod, lay)
	if err != nil {
		emsg := fmt.Sprintf("Error in creating snapshot: +%v", err)
		return operations.NewDescribeAppDefault(503).WithPayload(&models.Error{Message: &emsg})
	}
	return operations.NewNewSnapshotOK().WithPayload(body)
}

func (s *ServerCtx) ListSnapshotsHandler(params operations.ListSnapshotsParams) middleware.Responder {
	app := app.Describe(s.Db, &params.Appid)
	env := environ.Get(s.Db, &params.Environment)
	if app == nil || env == nil {
		return operations.NewDescribeAppDefault(404).WithPayload(nil)
	}
	lay := layout.OfBoth(s.Db, env, app)
	if lay == nil {
		return operations.NewDescribeAppDefault(404).WithPayload(nil)
	}
	pod := pod.Get(s.Db, &params.Pod, lay.Id).ToResponse()
	sxs := snapshot.FromPod(s.Db, pod)
	body := make([]*models.Snapshot, len(sxs))
	for i, ss := range sxs {
		body[i] = ss.ToResponse(s.Db, s.Flamescope)
	}

	return operations.NewListSnapshotsOK().WithPayload(body)
}

func (s *ServerCtx) InitHandle() {
	environ.InitTable(s.Db)
	layout.InitTable(s.Db)
	pod.InitTable(s.Db)
	app.InitTable(s.Db)
	snapshot.InitTable(s.Db)
}
