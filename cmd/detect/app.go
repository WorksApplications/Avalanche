package main

import (
	"database/sql"
	"flag"
	"log"
	"net/http"

	_ "github.com/go-sql-driver/mysql"

	"git.paas.workslan/resource_optimization/dynamic_analysis/pkg/environment"

	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/detect/server"
	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/detect/util"
)

func establishDBConn(dn string) *sql.DB {
	db, err := sql.Open("mysql", dn)
	if err != nil {
		log.Fatalln("Error on db", err)
	}
	return db
}

func main() {
	log.SetPrefix("detect:\t")
	dbconf := flag.String("db", "example:example@localhost?parseTime=True", "DB connexion")

	flag.Parse()
	args := flag.Args()
	log.Println(args)

	db := establishDBConn(*dbconf)
	t := true
	es := environ.ListConfig(db, nil, &t)
	x := server.HandlerClosure{make(chan *util.ScannerRequest), db}
	go util.Exchange(x.Ch)
	for _, e := range es {
		sreq := util.ScannerRequest{util.SCAN, &e.Name, nil}
		x.Ch <- &sreq
	}

	//log.Print(apps)
	http.HandleFunc("/subscription/", x.SubLogs)
	http.HandleFunc("/subscription", x.Logs)

	http.HandleFunc("/tracing", x.Tracing)
	//http.HandleFunc("/config", x.Config)
	http.HandleFunc("/config/environment", x.ConfigEnv)
	http.HandleFunc("/config/environment/", x.ConfigEnvSub)
	log.Fatal(http.ListenAndServe(":8080", nil))
}
