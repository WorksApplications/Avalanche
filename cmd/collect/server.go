package main

import (
	"flag"
	"log"
	"net/http"
	"time"

	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/models"
	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/restapi"
	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/restapi/operations"
	loads "github.com/go-openapi/loads"
	middleware "github.com/go-openapi/runtime/middleware"

	"database/sql"
	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/apps"
	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/environments"
	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/layout"
	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/pod"
	_ "github.com/go-sql-driver/mysql"
)

type ServerCtx struct {
	Db     *sql.DB
	detect string /* detect address */
}

func (s *ServerCtx) getAppsHandler(_ operations.GetAppsParams) middleware.Responder {
	body := app.ListAll(s.Db)
	return operations.NewGetAppsOK().WithPayload(body)
}

func (s *ServerCtx) describeAppHandler(params operations.DescribeAppParams) middleware.Responder {
	body := app.Describe(s.Db, &params.Appid)
	if body == nil {
		return operations.NewDescribeAppDefault(404).WithPayload(nil)
	}
	return operations.NewDescribeAppOK().WithPayload(body)
}

func (s *ServerCtx) getEnvironmentsHandler(params operations.GetEnvironmentsParams) middleware.Responder {
	app := app.Describe(s.Db, &params.Appid)
	if app == nil {
		return operations.NewDescribeAppDefault(404).WithPayload(nil)
	}
	lays := layout.OfApp(*app.ID, s.Db)
	if len(lays) == 0 {
		return operations.NewDescribeAppDefault(404).WithPayload(nil)
	}
	body := make([]*models.Environment, len(lays))
	for _, l := range lays {
		body = append(body, environ.FromLayout(s.Db, l))
	}
	return operations.NewGetEnvironmentsOK().WithPayload(body)
}

func (s *ServerCtx) describeEnvironmentHandler(params operations.DescribeEnvironmentParams) middleware.Responder {
	app := app.Describe(s.Db, &params.Appid)
	env := environ.Get(s.Db, &params.Environment)
	if app == nil || env == nil {
		return operations.NewDescribeAppDefault(404).WithPayload(nil)
	}
	lays := layout.OfBoth(*app.ID, *env.ID, s.Db)
	if len(lays) == 0 {
		return operations.NewDescribeAppDefault(404).WithPayload(nil)
	}
	body := environ.FromLayout(s.Db, lays[0])
	return operations.NewDescribeEnvironmentOK().WithPayload(body)
}

func (s *ServerCtx) getPodsHandler(params operations.GetPodsParams) middleware.Responder {
	app := app.Describe(s.Db, &params.Appid)
	env := environ.Get(s.Db, &params.Environment)
	if app == nil || env == nil {
		return operations.NewDescribeAppDefault(404).WithPayload(nil)
	}
	lays := layout.OfBoth(*app.ID, *env.ID, s.Db)
	if len(lays) == 0 {
		return operations.NewDescribeAppDefault(404).WithPayload(nil)
	}
	body := pod.FromLayout(s.Db, lays[0])
	return operations.NewGetPodsOK().WithPayload(*body)
}

func (s *ServerCtx) pollPodInfo() {
	/* If the retrieving schedule is invoked by detect, the place to post new data is unknown on testing. */
	ticker := time.NewTicker(2 * time.Minute)
	go func() {
		for t := range ticker.C {
			log.Printf("start to pull pods' information from %s|%s", s.detect, t)
			http.Get(s.detect)
			//pullDetect(s.Db)
		}
	}()
}

func (s *ServerCtx) initHandle() {
	app.InitTable(s.Db)
	environ.InitTable(s.Db)
	layout.InitTable(s.Db)
	pod.InitTable(s.Db)
}

func establishDBConn(dn string) *sql.DB {
	db, err := sql.Open("mysql", dn)
	if err != nil {
		log.Fatalln("Error on db", err)
	}
	return db
}

func main() {
	log.SetPrefix("collect:\t")

	swaggerSpec, err := loads.Embedded(restapi.SwaggerJSON, restapi.FlatSwaggerJSON)
	if err != nil {
		log.Fatalln(err)
	}

	api := operations.NewCollectAPI(swaggerSpec)

	init := flag.Bool("init", false, "Initialize?")
	dbconf := flag.String("db", "example:example@localhost", "DB connexion")
	port := flag.Int("port", 4981, "Port for this server")
	detect := flag.String("detect", "http://localhost:8081/", "\"detect\" service address")

	flag.Parse()
	args := flag.Args()
	log.Println(args)

	server := restapi.NewServer(api)
	server.Port = *port
	defer server.Shutdown()

	db := establishDBConn(*dbconf)
	ctx := ServerCtx{db, *detect}

	api.GetAppsHandler = operations.GetAppsHandlerFunc(ctx.getAppsHandler)
	api.DescribeAppHandler = operations.DescribeAppHandlerFunc(ctx.describeAppHandler)

	api.GetEnvironmentsHandler = operations.GetEnvironmentsHandlerFunc(ctx.getEnvironmentsHandler)
	api.DescribeEnvironmentHandler = operations.DescribeEnvironmentHandlerFunc(ctx.describeEnvironmentHandler)
	if *init {
		ctx.initHandle()
		log.Fatal("Initialize end")
	}

	if err := server.Serve(); err != nil {
		log.Fatalln(err)
	}
}
