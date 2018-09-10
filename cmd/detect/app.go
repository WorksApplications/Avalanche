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

    /* Get all known environments as the default subscriptions. */
	es := environ.ListConfig(db, nil, &t)

    /* First we set all environments so need a channel with a buffer with same size of capacity. */
	x := server.HandlerClosure{make(chan *util.ScannerRequest, len(es)), db}

	for _, e := range es {
		sreq := util.ScannerRequest{util.ADD, &e.Name, nil}
		x.Ch <- &sreq
	}

	go util.Exchange(x.Ch)

	//log.Print(apps)
	http.HandleFunc("/subscription/", x.SubRunner)
	http.HandleFunc("/subscription", x.Runner)
	//http.HandleFunc("/config", x.Config)
	http.HandleFunc("/config/environments", x.ConfigEnv)
	http.HandleFunc("/config/environments/", x.ConfigEnvSub)
	log.Fatal(http.ListenAndServe(":8080", nil))
}
