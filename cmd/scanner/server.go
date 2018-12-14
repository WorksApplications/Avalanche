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
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"github.com/WorksApplications/Avalanche/pkg/environment"
	"github.com/WorksApplications/Avalanche/pkg/log-scanner"
	"log"
	"net/http"
	"strings"
	"time"
)

func deserializeEnvironmentUpdate(req *http.Request) (*environ.Environ, error) {
	buf := new(bytes.Buffer)
	defer req.Body.Close()
	_, err := buf.ReadFrom(req.Body)
	if err != nil {
		log.Print("Read request failed: ", err)
		/* reading response failed */
		return nil, err
	}

	env := environ.Environ{
		Observe: true,
	}
	err = json.Unmarshal(buf.Bytes(), &env)

	if err != nil {
		log.Print("Parse request failed: ", err)
		return nil, err
	}

	return &env, nil
}

func update(db *sql.DB, res http.ResponseWriter, req *http.Request, ch chan<- *ScannerRequest) {
	env, err := deserializeEnvironmentUpdate(req)
	if err != nil {
		res.WriteHeader(http.StatusInternalServerError)
		return
	}

	/*
	 * Validate the name is identical
	 */
	ename := strings.TrimPrefix(req.URL.Path, "/config/environments/")
	if ename != env.Name {
		res.WriteHeader(http.StatusInternalServerError)
		return
	}
	prev := environ.ListConfig(db, &env.Name, nil)
	if len(prev) > 1 {
		/* XXX BUG */
		res.WriteHeader(http.StatusInternalServerError)
		return
	}

	/* When the resource is not recorded yet, I don't feel good to update here... */
	if len(prev) == 0 {
		environ.Add(db, env)
		res.WriteHeader(http.StatusOK)
		sreq := ScannerRequest{SCAN, &env.Name, nil}
		subscribe(sreq, res, req, ch)
		return
	}

	/* Commit to DB */
	environ.Update(db, env)

	/* Handle state change */
	if env.Observe != prev[0].Observe {
		code := SCAN
		if !env.Observe {
			code = DEL
		}
		sreq := ScannerRequest{code, &env.Name, nil}
		subscribe(sreq, res, req, ch)
	}
}

func add(db *sql.DB, res http.ResponseWriter, req *http.Request, ch chan<- *ScannerRequest) (*string, error) {
	env, err := deserializeEnvironmentUpdate(req)
	if err != nil {
		res.WriteHeader(http.StatusInternalServerError)
		return nil, err
	}

	prev := environ.ListConfig(db, &env.Name, nil)
	if len(prev) == 0 {
		/* Commit to DB */
		environ.Add(db, env)
		res.WriteHeader(http.StatusOK)
		/* Send request to scan the target if it is marked to "observe" */
		if env.Observe {
			sreq := ScannerRequest{SCAN, &env.Name, nil}
			subscribe(sreq, res, req, ch)
		}
	} else {
		/* XXX: A new environment should not exist a priori. */
		res.WriteHeader(http.StatusInternalServerError)
		return nil, err
	}

	return &env.Name, nil
}

func subscribe(sreq ScannerRequest, res http.ResponseWriter, req *http.Request, ch chan<- *ScannerRequest) error {
	t := time.NewTimer(20 * time.Second)

	select {
	case <-t.C:
		/* Couldn't write the request within a period(maybe Exchange() is gone). Inform this failure to him */
		res.WriteHeader(http.StatusRequestTimeout)
		return fmt.Errorf("Time flies: scan request failed; maybe stuck the scanner?")
	case ch <- &sreq:
		res.WriteHeader(http.StatusOK)
		return nil
	}
}

func get(res http.ResponseWriter, req *http.Request, ch chan<- *ScannerRequest, env *string) error {
	/* Prepare anew channel to pull out the result */
	/* We make a channel instead of using bi-directional shared channel because we have to have a co-relation between
	   request and the result. */
	resc := make(chan *scanner.Subscription, 16)
	// Expect it to be closed by remote, so I won't defer close(resc)
	sreq := ScannerRequest{DESC, env, resc}

	t := time.NewTimer(20 * time.Second)

	select {
	case <-t.C:
		/* Couldn't write the request within a period(maybe Exchange() is gone). Inform this failure to him */
		res.WriteHeader(http.StatusRequestTimeout)
		log.Println("Scanner Request can't be sent")
		return fmt.Errorf("Time flies: scan request failed; maybe stuck the scanner?")
	case ch <- &sreq:
		/* Request is written. Wait for all the answer */
		subs := make([]*scanner.Subscription, 0)
		for sub := range resc {
			subs = append(subs, sub)
		}
		reply, e := json.Marshal(&subs)
		if e != nil {
			res.WriteHeader(http.StatusInternalServerError)
			return fmt.Errorf("Marshaling to Subscription failed: %+v", subs)
		}
		res.Write(reply)
		return nil
	}
}

func (s cfg) partialGet(res http.ResponseWriter, req *http.Request) {
	/* Has trailing slash or sub-location */
	switch req.Method {
	case "GET":
		env := strings.TrimPrefix(req.URL.Path, "/logs/")
		log.Printf("S: %s %s", req.Method, req.URL.Path)
		get(res, req, s.ch, &env)
	}
}

func (s cfg) dump(res http.ResponseWriter, req *http.Request) {
	log.Printf("R: %s %s", req.Method, req.URL.Path)
	switch req.Method {
	case "GET":
		err := get(res, req, s.ch, nil /* indicates "gimme-all" */)
		if err != nil {
			panic(err)
		}
	}
}

func (s cfg) ConfigEnv(res http.ResponseWriter, req *http.Request) {
	log.Printf("C: %s %s", req.Method, req.URL.Path)
	var name *string
	var err error
	switch req.Method {
	case "POST":
		name, err = add(s.db, res, req, s.ch)
		if err != nil {
			return
		}
		fallthrough
	case "GET":
		/* XXX Feature join unregistered environments that appear in mischo log */
		envs := environ.ListConfig(s.db, name, nil)
		reply, e := json.Marshal(envs)
		if e != nil {
			res.WriteHeader(http.StatusInternalServerError)
			return
		}
		res.Write(reply)
	}
}

func (s cfg) ConfigEnvSub(res http.ResponseWriter, req *http.Request) {
	log.Printf("Q: %s %s", req.Method, req.URL.Path)
	switch req.Method {
	case "PUT":
		update(s.db, res, req, s.ch)
		fallthrough
	case "GET":
		env := strings.TrimPrefix(req.URL.Path, "/config/environments/")
		envs := environ.ListConfig(s.db, &env, nil)
		reply, e := json.Marshal(envs)
		if e != nil {
			res.WriteHeader(http.StatusInternalServerError)
			return
		}
		res.Write(reply)
	case "DELETE":
	}
}
