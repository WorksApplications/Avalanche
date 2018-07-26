package detectService

import (
	"net/http"
    "log"
	//"strings"
	"../crowler"
    "time"
    "fmt"
    "bytes"
)

type HandlerClosure struct {
    Ch chan *crowl.ScannerRequest
}

func subscribe(res http.ResponseWriter, req *http.Request, ch chan *crowl.ScannerRequest) {
    if req.URL.Path != "/subscription" {
        res.WriteHeader(http.StatusNotFound)
        return
    }
    buf := new(bytes.Buffer)
    defer req.Body.Close()
    _, e := buf.ReadFrom(req.Body)
    if e != nil {
        res.WriteHeader(http.StatusInternalServerError)
        return
    }
    sub := crowl.Subscription{buf.String(), nil}
    sreq := crowl.ScannerRequest{crowl.ADD, &sub}

    t := time.NewTimer(20 * time.Second)

    select {
    case <-t.C:
        res.WriteHeader(http.StatusRequestTimeout)
    case ch <- &sreq:
        res.WriteHeader(http.StatusOK)
    }


    fmt.Fprintf(res, "%s", buf)
}

func (s HandlerClosure) Runner(res http.ResponseWriter, req *http.Request) {
    log.Printf("%s %s", req.Method, req.URL.Path)
    switch req.Method {
    case "GET":

    case "POST":
        subscribe(res, req, s.Ch)
    case "DELETE":
    }
}

