package main

import (
	"log"
	"net/http"
	//"strings"
	"../../pkg/crowler"
	"../../pkg/detectHandler"
)

func main() {
	log.SetPrefix("detect:\t")
	x := detectService.HandlerClosure{make(chan *crowl.ScannerRequest)}
	go crowl.ScheduleScan(x.ch)
	//log.Print(apps)
	http.HandleFunc("/subscription/", x.runner)
	log.Fatal(http.ListenAndServe(":8080", nil))
}
