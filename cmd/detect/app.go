package main

import (
	"log"
	"net/http"
    "git.paas.workslan/resource_optimization/dynamic_analysis/cmd/detect/server"
    "git.paas.workslan/resource_optimization/dynamic_analysis/cmd/detect/util"
)

func main() {
	log.SetPrefix("detect:\t")
	x := server.HandlerClosure{make(chan *util.ScannerRequest)}
	go util.Exchange(x.Ch)
	//log.Print(apps)
	http.HandleFunc("/subscription/", x.SubRunner)
	http.HandleFunc("/subscription", x.Runner)
	log.Fatal(http.ListenAndServe(":8080", nil))
}
