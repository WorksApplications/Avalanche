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

func getAllEnviron(db *sql.DB) []string {
	es := environ.ListAll(db)
	ret := make([]string, 0, len(es))
	for _, e := range es {
		ret = append(ret, *e.Name)
	}
	return ret
}

func main() {
	log.SetPrefix("detect:\t")
	dbconf := flag.String("db", "example:example@localhost?parseTime=True", "DB connexion")
    log.Print(*dbconf)
	flag.Parse()
	args := flag.Args()
	log.Println(args)

	db := establishDBConn(*dbconf)
	es := getAllEnviron(db)

	x := server.HandlerClosure{make(chan *util.ScannerRequest)}
	go util.Exchange(x.Ch)
	for _, e := range es {
		sreq := util.ScannerRequest{util.ADD, &e, nil}
		x.Ch <- &sreq
	}

	//log.Print(apps)
	http.HandleFunc("/subscription/", x.SubRunner)
	http.HandleFunc("/subscription", x.Runner)
	log.Fatal(http.ListenAndServe(":8080", nil))
}
