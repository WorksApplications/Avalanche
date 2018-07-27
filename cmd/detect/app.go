package main

import (
	"log"
	"net/http"
	//"strings"
    "git.paas.workslan/resource_optimization/dynamic_analysis/pkg/crowler"
    "git.paas.workslan/resource_optimization/dynamic_analysis/pkg/detectService"
)

func main() {
	log.SetPrefix("detect:\t")
	x := detectService.HandlerClosure{make(chan *crowl.ScannerRequest)}
	go crowl.Exchange(x.Ch)
	//log.Print(apps)
	http.HandleFunc("/subscription/", x.SubRunner)
	http.HandleFunc("/subscription", x.Runner)
	log.Fatal(http.ListenAndServe(":8080", nil))
}
