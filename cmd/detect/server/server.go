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
        log.Printf("Read request failed: ", err)
		/* reading response failed */
		return nil, err
	}

	var env environ.Environ
	err = json.Unmarshal(buf.Bytes(), &env)

	if err != nil {
        log.Printf("Parse request failed: ", err)
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

	prev := environ.ListConfig(db, &env.Name, nil)
	if len(prev) == 0 {
		environ.Add(db, env)
		res.WriteHeader(http.StatusOK)
		sreq := util.ScannerRequest{util.SCAN, &env.Name, nil}
		subscribe(sreq, res, req, ch)
	} else if len(prev) > 1 {
		/* XXX BUG */
		res.WriteHeader(http.StatusInternalServerError)
	} else if env.Observe != prev[0].Observe {
		environ.Update(db, env)
		code := util.SCAN
		if !env.Observe {
			code = util.DEL
		}
		sreq := util.ScannerRequest{code, &env.Name, nil}
		subscribe(sreq, res, req, ch)
	} else {
		environ.Update(db, env)
	}
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
		return fmt.Errorf("Time flies: scan request failed; maybe stuck the scanner?: Magic: %x", rand.Int31())
	case ch <- &sreq:
		/* Request is written. Wait for all the answer */
		subs := make([]*detect.Subscription, 0)
		for sub := range resc {
			subs = append(subs, sub)
		}
		reply, e := json.Marshal(&subs)
		if e != nil {
			res.WriteHeader(http.StatusInternalServerError)
			return fmt.Errorf("Marshaling to Subscription failed...: Magic: %x", rand.Int31())
		}
		res.Write(reply)
		return nil
	}
}

func (s HandlerClosure) SubRunner(res http.ResponseWriter, req *http.Request) {
	/* Has trailing slash or sub-location */
	log.Printf("S: %s %s", req.Method, req.URL.Path)
	switch req.Method {
	case "GET":
		env := strings.TrimPrefix(req.URL.Path, "/subscriptions/")
		if env == "" {
			get(res, req, s.Ch, nil)
		} else {
			get(res, req, s.Ch, &env)
		}
	}
}

func (s HandlerClosure) Runner(res http.ResponseWriter, req *http.Request) {
	log.Printf("R: OBSOLETE: %s %s", req.Method, req.URL.Path)
	switch req.Method {
	case "GET":
		get(res, req, s.Ch, nil /* indicates "gimme-all" */)
	}
}

func (s HandlerClosure) ConfigEnv(res http.ResponseWriter, req *http.Request) {
	log.Printf("C: %s %s", req.Method, req.URL.Path)
	switch req.Method {
	case "GET":
		/* XXX Feature join unregistered environments that appear in mischo log */
		envs := environ.ListConfig(s.Db, nil, nil)
		reply, e := json.Marshal(envs)
		if e != nil {
			res.WriteHeader(http.StatusInternalServerError)
			return
		}
		res.Write(reply)
	case "POST":
		update(s.Db, res, req, s.Ch)
	}
}

func (s HandlerClosure) ConfigEnvSub(res http.ResponseWriter, req *http.Request) {
	log.Printf("Q: %s %s", req.Method, req.URL.Path)
	switch req.Method {
	case "GET":
		env := strings.TrimPrefix(req.URL.Path, "/config/environments/")
		envs := environ.ListConfig(s.Db, &env, nil)
		reply, e := json.Marshal(envs)
		if e != nil {
			res.WriteHeader(http.StatusInternalServerError)
			return
		}
		res.Write(reply)
	case "PUT":
		update(s.Db, res, req, s.Ch)
	case "DELETE":
	}
}
