package main

import (
	"database/sql"
	"flag"
	"log"
	"net/http"

	_ "github.com/go-sql-driver/mysql"

	"git.paas.workslan/resource_optimization/dynamic_analysis/pkg/environment"
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
	log.SetFlags(log.Lshortfile | log.Ldate | log.Ltime)
	dbconf := flag.String("db", "example:example@localhost?parseTime=True", "DB connexion")

	flag.Parse()
	args := flag.Args()
	log.Println(args)

	db := establishDBConn(*dbconf)
	t := true
	es := environ.ListConfig(db, nil, &t)
	x := HandlerClosure{make(chan *ScannerRequest), db}
	go Exchange(x.Ch)
	for _, e := range es {
		sreq := ScannerRequest{SCAN, &e.Name, nil}
		x.Ch <- &sreq
	}

	//log.Print(apps)
	http.HandleFunc("/subscriptions/", x.SubRunner)
	http.HandleFunc("/subscriptions", x.Runner)
	//http.HandleFunc("/config", x.Config)
	http.HandleFunc("/config/environments", x.ConfigEnv)
	http.HandleFunc("/config/environments/", x.ConfigEnvSub)
	log.Fatal(http.ListenAndServe(":8080", nil))
}
