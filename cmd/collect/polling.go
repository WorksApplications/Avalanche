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
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"time"

	"github.com/WorksApplications/Avalanche/generated_files/models"

	"database/sql"
	"github.com/WorksApplications/Avalanche/pkg/app"
	"github.com/WorksApplications/Avalanche/pkg/environment"
	"github.com/WorksApplications/Avalanche/pkg/layout"
	"github.com/WorksApplications/Avalanche/pkg/pod"

	"github.com/WorksApplications/Avalanche/pkg/log-scanner"
	_ "github.com/go-sql-driver/mysql"
)

func (s *cfg) pull() error {
	log.Printf("start to pull pods' information from %s", s.Scanner+"/logs")
	r, err := http.Get(s.Scanner + "/logs")
	if err != nil {
		log.Println("Poll failed with ", err)
		return err
	}
	d, err := ioutil.ReadAll(r.Body)
	if err != nil {
		log.Println("Poll f-ed up!", err)
		return err
	}
	defer r.Body.Close()

	var p []scanner.Subscription
	err = json.Unmarshal(d, &p)
	if err != nil {
		log.Println("Unmarshal failed!", err)
		log.Printf("res: %+v", p)
		return err
	}
	found := make(map[int64]struct{})
	for _, e := range p {
		/* Enlist live pods in this environment */
		fs := recursiveInsert(s.Db, &e)
		for _, f := range fs {
			found[f] = struct{}{}
		}
	}
	s.TracedPod = found
	log.Print("[Discovery] Found:", len(s.TracedPod))
	return nil
}

func recursiveInsert(db *sql.DB, p *scanner.Subscription) []int64 {
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
			p := pod.Assign(db, &p.Name, *en.ID, *an.ID, l.Id, &p.Link, &p.LastUpdate).ToResponse()
			found = append(found, p.ID)
		}
	}
	return found
}

func (s *cfg) PollPodInfo() {
	/* If the retrieving schedule is invoked by detect, the place to post new data is unknown on testing. */
	t := time.NewTicker(1 * time.Minute)
	once := make(chan int, 1)
	once <- 1
	go func(flag *bool) {
		for {
			select {
			case <-once:
				close(once)
				once = nil
				checkerr := s.checkPodAvailability()
				pullerr := s.pull()
				if checkerr == nil && pullerr == nil {
					*flag = true
				} else {
					log.Print("Failed to setup", checkerr, pullerr)
					panic("Initialization failed")
				}
			case <-t.C:
				s.checkPodAvailability()
				s.pull()
			}
		}
	}(&s.Ready)

}

func (s *cfg) checkPodAvailability() error {
	if s.Enroll == "" {
		/* disable this feature */
		return nil
	}
	r, err := http.Get(s.Enroll)
	if err != nil {
		log.Println("Poke enroll at ", s.Enroll, " failed!")
		return err
	}
	d, err := ioutil.ReadAll(r.Body)
	if err != nil {
		log.Println("Reading enroll at ", s.Enroll, " response failed")
		return err
	}
	defer r.Body.Close()

	type Response struct {
		Name     string
		Image    string
		IsTraced bool
	}

	type MetaResponse struct {
		List   []Response
		Source string
	}

	var response []MetaResponse

	err = json.Unmarshal(d, &response)
	if err != nil {
		log.Println("Parse error with the response", err, string(d))
		return err
	}

	rps := make(map[string]struct{}, 0)
	for _, v := range response {
		for _, w := range v.List {
			if w.IsTraced {
				rps[w.Name] = struct{}{}
			}
		}
	}
	s.RunningPod = rps
	log.Printf("%+v", s.RunningPod)
	return nil
}

func mapIsAliveFlag(ps []*models.Pod, alive map[string]struct{}) {
	for _, p := range ps {
		_, prs := alive[*p.Name]
		p.IsAlive = prs
	}
}
