package main

import (
	"database/sql"
	"flag"
	"log"
	"net/http"

	_ "github.com/go-sql-driver/mysql"

	"git.paas.workslan/resource_optimization/dynamic_analysis/pkg/environment"

	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/restapi"
	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/restapi/operations"
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

func (s *ServerCtx) GetConfig(p operations.GetConfigParams) middleware.Responder {
    opts := ["environments"]
	return operations.NewHealthzOK().WithPayload(opts)
}

func (s *ServerCtx) ListEnvironmentConfig(p operations.GetConfigParams) middleware.Responder {
}

func (s *ServerCtx) AddEnvironmentConfig(p operations.GetConfigParams) middleware.Responder {
}

func (s *ServerCtx) AddEnvironmentConfig(p operations.GetConfigParams) middleware.Responder {
}

func (s *ServerCtx) HealthzHandler(_ operations.HealthzParams) middleware.Responder {
	return operations.NewHealthzOK().WithPayload("Vaer sa godt")
}


func main() {
	log.SetPrefix("config:\t")
	dbconf := flag.String("db", "example:example@localhost?parseTime=True", "DB connexion")
	detect := flag.String("detect", "http://localhost:8080", "\"detect\" service address")
	//collect := flag.String("collect", "http://localhost:8080", "\"collect\" service address")
	port := flag.Int("port", 4986, "Port for this server")
	flag.Parse()
	args := flag.Args()
	log.Println(args)

	db := establishDBConn(*dbconf)
	es := getAllEnviron(db)

	server := restapi.NewServer(api)
	server.Port = *port
	defer server.Shutdown()

	db := establishDBConn(*dbconf)

	api.HealthzHandler = operations.HealthzHandlerFunc(ctx.HealthzHandler)

	if err := server.Serve(); err != nil {
		log.Fatalln(err)
	}
}
