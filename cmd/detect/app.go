package main

import (
	"log"
	"net/http"
	//"strings"
	"../../pkg/crowler"
	"../../pkg/detectService"
)

func main() {
	log.SetPrefix("detect:\t")
	x := detectService.HandlerClosure{make(chan *crowl.ScannerRequest)}
	go crowl.ScheduleScan(x.Ch)
	//log.Print(apps)
	http.HandleFunc("/subscription/", x.Runner)
	http.HandleFunc("/subscription", x.Runner)
	log.Fatal(http.ListenAndServe(":8080", nil))
}
