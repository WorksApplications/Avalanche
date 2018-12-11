/*
 * Copyright (c) 2018 Works Applications Co., Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package main

import (
	"fmt"
	"log"

	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/models"
	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/restapi/operations"
	middleware "github.com/go-openapi/runtime/middleware"

	"database/sql"
	"git.paas.workslan/resource_optimization/dynamic_analysis/pkg/app"
	"git.paas.workslan/resource_optimization/dynamic_analysis/pkg/environment"
	"git.paas.workslan/resource_optimization/dynamic_analysis/pkg/layout"
	"git.paas.workslan/resource_optimization/dynamic_analysis/pkg/pod"
	"git.paas.workslan/resource_optimization/dynamic_analysis/pkg/snapshot"

	_ "github.com/go-sql-driver/mysql"
)

type cfg struct {
	Db        *sql.DB
	Scanner   string /* detect address */
	Enroll    string
	Extract   string /* extract address */
	Pvmount   string
	Temporald string
	TracedPod map[int64]struct{}
	IsMaster  bool
	Ready     bool

	Flamescope string
	RunningPod map[string]struct{}
}

func (s *cfg) HealthzHandler(_ operations.HealthzParams) middleware.Responder {
	if s.Ready {
		return operations.NewHealthzOK().WithPayload("Vaer sa godt")
	} else {
		return operations.NewHealthzDefault(503).WithPayload(nil)
	}
}

func (s *cfg) ListAvailablePods(_ operations.ListAvailablePodsParams) middleware.Responder {
	body := make([]*models.Pod, 0)
	for pf, _ := range s.TracedPod {
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

		body = append(body, r)
	}
	mapIsAliveFlag(body, s.RunningPod)
	if len(body) == 0 {
		operations.NewDescribeAppDefault(404).WithPayload(nil)
	}
	return operations.NewListAvailablePodsOK().WithPayload(body)
}

func (s *cfg) GetAppsHandler(_ operations.GetAppsParams) middleware.Responder {
	body := app.ListNames(s.Db)
	return operations.NewGetAppsOK().WithPayload(body)
}

func (s *cfg) DescribeAppHandler(params operations.DescribeAppParams) middleware.Responder {
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

func (s *cfg) GetEnvironmentsHandler(params operations.GetEnvironmentsParams) middleware.Responder {
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

func (s *cfg) DescribeEnvironmentHandler(params operations.DescribeEnvironmentParams) middleware.Responder {
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

func (s *cfg) GetPodsHandler(params operations.GetPodsParams) middleware.Responder {
	lay := layHelper(s.Db, &params.Appid, &params.Environment)
	if lay == nil {
		return operations.NewDescribeAppDefault(404).WithPayload(nil)
	}
	ps := pod.FromLayout(s.Db, lay)
	body := podHelper(s, ps)
	return operations.NewGetPodsOK().WithPayload(body)
}

func (s *cfg) DescribePodHandler(params operations.DescribePodParams) middleware.Responder {
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

func podDescriber(s *cfg, pod *models.Pod) {
	sn := snapshot.FromPod(s.Db, pod)
	pod.Snapshots = make([]*models.Snapshot, len(sn))
	for i, n := range sn {
		pod.Snapshots[i] = n.ToResponse(s.Db, s.Flamescope)
	}
	_, pod.IsAlive = s.RunningPod[*pod.Name]
}

func podHelper(s *cfg, ps []*pod.PodInternal) []*models.Pod {
	body := make([]*models.Pod, len(ps))
	for i, p := range ps {
		body[i] = p.ToResponse()
		podDescriber(s, body[i])
	}
	//mapIsAliveFlag(body, s.Perfing)
	return body
}

func (s *cfg) NewSnapshotHandler(params operations.NewSnapshotParams) middleware.Responder {
	app := app.Describe(s.Db, &params.Appid)
	env := environ.Get(s.Db, &params.Environment)
	if app == nil || env == nil {
		emsg := fmt.Sprintf("app %+v or environment %+v is invalid", app, env)
		return operations.NewDescribeAppDefault(404).WithPayload(&models.Error{Message: &emsg})
	}
	lay := layout.OfBoth(s.Db, env, app)
	if lay == nil {
		emsg := fmt.Sprintf("ENOLAYOUT app %s is not deployed in environment %s", *app.Name, *env.Name)
		return operations.NewDescribeAppDefault(404).WithPayload(&models.Error{Message: &emsg})
	}
	pod := pod.Get(s.Db, &params.Pod, lay.Id).ToResponse()
	if pod == nil {
		emsg := fmt.Sprintf("ENOPOD %s couldn't found on %d", params.Pod, lay.Id)
		return operations.NewDescribeAppDefault(404).WithPayload(&models.Error{Message: &emsg})
	}
	body, err := snapshot.New(&s.Extract, &s.Pvmount, &s.Temporald, s.Db, app, pod, lay)
	if err != nil {
		emsg := fmt.Sprintf("Error in creating snapshot: +%v", err)
		return operations.NewDescribeAppDefault(503).WithPayload(&models.Error{Message: &emsg})
	}
	return operations.NewNewSnapshotOK().WithPayload(body)
}

func (s *cfg) ShowSnapshotsOfPodHandler(params operations.ShowSnapshotsOfPodParams) middleware.Responder {
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

	return operations.NewShowSnapshotsOfPodOK().WithPayload(body)
}

func (s *cfg) ListSnapshotsHandler(params operations.ListSnapshotsParams) middleware.Responder {
	var ss []*models.Snapshot
	var max int64
	if params.Max == nil {
		max = 10
	} else {
		max = *params.Max
	}

	switch *params.OrderBy {
	case "":
		fallthrough
	case "date":
		si := snapshot.GetLatest(s.Db, max)
		ss = make([]*models.Snapshot, len(si))
		for i, n := range si {
			ss[i] = n.ToResponse(s.Db, s.Flamescope)
		}
	default:
		mes := "No other ordering keyword supported than \"date\""
		return operations.NewListSnapshotsDefault(400).WithPayload(&models.Error{Message: &mes})
	}

	return operations.NewListSnapshotsOK().WithPayload(ss)
}

func (s *cfg) GetSnapshotHandler(params operations.GetSnapshotParams) middleware.Responder {
	ss, err := snapshot.GetByUuid(s.Db, params.UUID)
	if err != nil {
		e := err.Error()
		return operations.NewListSnapshotsDefault(400).WithPayload(&models.Error{Message: &e})
	}

	return operations.NewGetSnapshotOK().WithPayload(ss.ToResponse(s.Db, s.Flamescope))
}

func (s *cfg) InitHandle() {
	environ.InitTable(s.Db)
	layout.InitTable(s.Db)
	pod.InitTable(s.Db)
	app.InitTable(s.Db)
	snapshot.InitTable(s.Db)
}
