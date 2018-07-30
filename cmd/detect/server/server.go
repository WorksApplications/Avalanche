package server

import (
	"bytes"
	"encoding/json"
	"fmt"
	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/detect/util"
	"git.paas.workslan/resource_optimization/dynamic_analysis/pkg/model"
	"log"
	"net/http"
	"strings"
	"time"
)

type HandlerClosure struct {
	Ch chan *util.ScannerRequest
}

func subscribe(res http.ResponseWriter, req *http.Request, ch chan *util.ScannerRequest) {
	buf := new(bytes.Buffer)
	defer req.Body.Close()
	r, e := buf.ReadFrom(req.Body)
	if req.URL.Path != "/subscription" || r == 0 {
		res.WriteHeader(http.StatusNotFound)
		return
	}
	if e != nil {
		res.WriteHeader(http.StatusInternalServerError)
		return
	}
	sub := model.Subscription{buf.String(), nil}
	sreq := util.ScannerRequest{util.SCAN, &sub}

	t := time.NewTimer(20 * time.Second)

	select {
	case <-t.C:
		res.WriteHeader(http.StatusRequestTimeout)
	case ch <- &sreq:
		res.WriteHeader(http.StatusOK)
	}

	fmt.Fprintf(res, "%s", buf)
}

func get(res http.ResponseWriter, req *http.Request, ch chan *util.ScannerRequest) {
	env := strings.TrimPrefix(req.URL.Path, "/subscription/")
	log.Printf("%s", env)
	sub := model.Subscription{env, nil}
	sreq := util.ScannerRequest{util.PULL, &sub}

	t := time.NewTimer(20 * time.Second)

	select {
	case <-t.C:
		res.WriteHeader(http.StatusRequestTimeout)
	case ch <- &sreq:
		sub := <-ch
		apps := sub.Sub.Apps
		reply, e := json.Marshal(&apps)
		if e != nil {
			res.WriteHeader(http.StatusInternalServerError)
			return
		}
		res.Write(reply)
	}
}

func (s HandlerClosure) SubRunner(res http.ResponseWriter, req *http.Request) {
	log.Printf("%s %s", req.Method, req.URL.Path)
	switch req.Method {
	case "GET":
		get(res, req, s.Ch)
	case "DELETE":
	}
}

func (s HandlerClosure) Runner(res http.ResponseWriter, req *http.Request) {
	log.Printf("%s %s", req.Method, req.URL.Path)
	switch req.Method {
	case "POST":
		subscribe(res, req, s.Ch)
	case "DELETE":
	}
}
