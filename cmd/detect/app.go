package main

import (
	"log"
	//"net/http"
	//"strings"
    "../../pkg/crowler"
)

func main() {
	log.SetPrefix("detect:\t")
    scanch := make(chan *crowl.ScannerRequest)
    crowl.ScheduleScan(scanch)
	//log.Print(apps)
	//http.HandleFunc("/subscription", s.Poll)
	//log.Fatal(http.ListenAndServe(":8080", nil))
}
