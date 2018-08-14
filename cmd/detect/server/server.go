package server

import (
	"bytes"
	"encoding/json"
	"fmt"
	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/detect/util"
	"git.paas.workslan/resource_optimization/dynamic_analysis/pkg/detect"
	"log"
	"net/http"
	"strings"
	"time"
)

type HandlerClosure struct {
	Ch chan *util.ScannerRequest
}

func subscribe(res http.ResponseWriter, req *http.Request, ch chan<- *util.ScannerRequest) {
	buf := new(bytes.Buffer)
	defer req.Body.Close()
	r, e := buf.ReadFrom(req.Body)
	if e != nil {
		/* reading response failed */
		res.WriteHeader(http.StatusInternalServerError)
		return
	}
	if req.URL.Path != "/subscription" || r == 0 {
		/* URL is invalid */
		res.WriteHeader(http.StatusNotFound)
		return
	}

	env := buf.String()
	sreq := util.ScannerRequest{util.SCAN, &env, nil}

	t := time.NewTimer(20 * time.Second)

	select {
	case <-t.C:
		/* Couldn't write the request within a period(maybe Exchange() is gone). Inform this failure to him */
		res.WriteHeader(http.StatusRequestTimeout)
	case ch <- &sreq:
		res.WriteHeader(http.StatusOK)
	}

	fmt.Fprintf(res, "%s", buf)
}

func get(res http.ResponseWriter, req *http.Request, ch chan<- *util.ScannerRequest, env *string) {
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
	case ch <- &sreq:
		/* Request is written. Wait for all the answer */
		subs := make([]*detect.Subscription, 0)
		for sub := range resc {
			subs = append(subs, sub)
		}
		reply, e := json.Marshal(&subs)
		if e != nil {
			res.WriteHeader(http.StatusInternalServerError)
			return
		}
		res.Write(reply)
	}
}

func (s HandlerClosure) SubRunner(res http.ResponseWriter, req *http.Request) {
	/* Has trailing slash or sub-location */
	log.Printf("S: %s %s", req.Method, req.URL.Path)
	switch req.Method {
	case "GET":
		env := strings.TrimPrefix(req.URL.Path, "/subscription/")
		if env == "" {
			get(res, req, s.Ch, nil)
		} else {
			get(res, req, s.Ch, &env)
		}
	case "DELETE":
	}
}

func (s HandlerClosure) Runner(res http.ResponseWriter, req *http.Request) {
	log.Printf("R: %s %s", req.Method, req.URL.Path)
	switch req.Method {
	case "GET":
		get(res, req, s.Ch, nil /* indicates "gimme-all" */)
	case "POST":
		subscribe(res, req, s.Ch)
	case "DELETE":
	}
}
