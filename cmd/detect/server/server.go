package server

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/detect/util"
	"git.paas.workslan/resource_optimization/dynamic_analysis/pkg/detect"
	"git.paas.workslan/resource_optimization/dynamic_analysis/pkg/environment"
	"log"
	"math/rand"
	"net/http"
	"strings"
	"time"
)

type HandlerClosure struct {
	Ch chan *util.ScannerRequest
	Db *sql.DB
}

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

func update(db *sql.DB, res http.ResponseWriter, req *http.Request, ch chan<- *util.ScannerRequest) {
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
		sreq := util.ScannerRequest{util.SCAN, &env.Name, nil}
		subscribe(sreq, res, req, ch)
		return
	}

	/* Commit to DB */
	environ.Update(db, env)

	/* Handle state change */
	if env.Observe != prev[0].Observe {
		code := util.SCAN
		if !env.Observe {
			code = util.DEL
		}
		sreq := util.ScannerRequest{code, &env.Name, nil}
		subscribe(sreq, res, req, ch)
	}
}

func add(db *sql.DB, res http.ResponseWriter, req *http.Request, ch chan<- *util.ScannerRequest) (*string, error) {
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
			sreq := util.ScannerRequest{util.SCAN, &env.Name, nil}
			subscribe(sreq, res, req, ch)
		}
	} else {
		/* XXX: A new environment should not exist a priori. */
		res.WriteHeader(http.StatusInternalServerError)
		return nil, err
	}

	return &env.Name, nil
}

func subscribe(sreq util.ScannerRequest, res http.ResponseWriter, req *http.Request, ch chan<- *util.ScannerRequest) error {
	t := time.NewTimer(20 * time.Second)

	select {
	case <-t.C:
		/* Couldn't write the request within a period(maybe Exchange() is gone). Inform this failure to him */
		res.WriteHeader(http.StatusRequestTimeout)
		return fmt.Errorf("Time flies: scan request failed; maybe stuck the scanner?: Magic: %x", rand.Int31())
	case ch <- &sreq:
		res.WriteHeader(http.StatusOK)
		return nil
	}
}

func get(res http.ResponseWriter, req *http.Request, ch chan<- *util.ScannerRequest, env *string) error {
	/* Prepare anew channel to pull out the result */
	/* We make a channel instead of using bi-directional shared channel because we have to have a co-relation between
	   request and the result. */
	resc := make(chan *detect.Subscription, 16)
	// Expect it to be closed by remote, so I won't defer close(resc)
	sreq := util.ScannerRequest{util.DESC, env, resc}

	t := time.NewTimer(20 * time.Second)

	select {
	case <-t.C:
		/* Couldn't write the request within a period(maybe Exchange() is gone). Inform this failure to him */
		res.WriteHeader(http.StatusRequestTimeout)
		log.Println("Scanner Request can't be sent")
		return fmt.Errorf("Time flies: scan request failed; maybe stuck the scanner?")
	case ch <- &sreq:
		/* Request is written. Wait for all the answer */
		subs := make([]*detect.Subscription, 0)
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

func (s HandlerClosure) SubRunner(res http.ResponseWriter, req *http.Request) {
	/* Has trailing slash or sub-location */
	switch req.Method {
	case "GET":
		env := strings.TrimPrefix(req.URL.Path, "/subscriptions/")
		if env == "" {
			log.Printf("S: OBSOLETE: %s %s", req.Method, req.URL.Path)
			s.Runner(res, req)
		} else {
			log.Printf("S: %s %s", req.Method, req.URL.Path)
			get(res, req, s.Ch, &env)
		}
	}
}

func (s HandlerClosure) Runner(res http.ResponseWriter, req *http.Request) {
	log.Printf("R: %s %s", req.Method, req.URL.Path)
	switch req.Method {
	case "GET":
		err := get(res, req, s.Ch, nil /* indicates "gimme-all" */)
		if err != nil {
			panic(err)
		}
	}
}

func (s HandlerClosure) ConfigEnv(res http.ResponseWriter, req *http.Request) {
	log.Printf("C: %s %s", req.Method, req.URL.Path)
	var name *string
	var err error
	switch req.Method {
	case "POST":
		name, err = add(s.Db, res, req, s.Ch)
		if err != nil {
			return
		}
		fallthrough
	case "GET":
		/* XXX Feature join unregistered environments that appear in mischo log */
		envs := environ.ListConfig(s.Db, name, nil)
		reply, e := json.Marshal(envs)
		if e != nil {
			res.WriteHeader(http.StatusInternalServerError)
			return
		}
		res.Write(reply)
	}
}

func (s HandlerClosure) ConfigEnvSub(res http.ResponseWriter, req *http.Request) {
	log.Printf("Q: %s %s", req.Method, req.URL.Path)
	switch req.Method {
	case "PUT":
		update(s.Db, res, req, s.Ch)
		fallthrough
	case "GET":
		env := strings.TrimPrefix(req.URL.Path, "/config/environments/")
		envs := environ.ListConfig(s.Db, &env, nil)
		reply, e := json.Marshal(envs)
		if e != nil {
			res.WriteHeader(http.StatusInternalServerError)
			return
		}
		res.Write(reply)
	case "DELETE":
	}
}
