package main

import (
	"flag"
	"log"

	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/restapi"
	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/restapi/operations"
	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/models"
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
	Db *sql.DB
}

func (s *ServerCtx) getAppsHandler(_ operations.GetAppsParams) middleware.Responder {
	body := app.ListAll(s.Db)
	return operations.NewGetAppsOK().WithPayload(body)
}

func (s *ServerCtx) describeAppHandler(params operations.DescribeAppParams) middleware.Responder {
	body := app.Describe(s.Db, &params.Appid)
	return operations.NewDescribeAppOK().WithPayload(body)
}

func (s *ServerCtx) getEnvironmentsHandler(params operations.GetEnvironmentsParams) middleware.Responder {
    app := app.Describe(s.Db, &params.Appid)
    lays := layout.OfApp(*app.ID, s.Db)
    body := make([]*models.Environment, len(*lays))
    for _, l := range *lays {
        body = append(body, environ.FromLayout(s.Db, l))
    }
	return operations.NewGetEnvironmentsOK().WithPayload(body)
}

func (s *ServerCtx) describeEnvironmentHandler(params operations.DescribeEnvironmentParams) middleware.Responder {
    app := app.Describe(s.Db, &params.Appid)
    env := environ.Get(s.Db, &params.Environment)
    lays := layout.OfBoth(*app.ID, *env.ID, s.Db)
    body := environ.FromLayout(s.Db, (*lays)[0])
	return operations.NewDescribeEnvironmentOK().WithPayload(body)
}

func (s *ServerCtx) getPodsHandler(params operations.GetPodsParams) middleware.Responder {
    app := app.Describe(s.Db, &params.Appid)
    env := environ.Get(s.Db, &params.Environment)
    lays := layout.OfBoth(*app.ID, *env.ID, s.Db)
    body := pod.FromLayout(s.Db, (*lays)[0])
	return operations.NewGetPodsOK().WithPayload(*body)
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

	server := restapi.NewServer(api)
	defer server.Shutdown()

	db := establishDBConn("test")
	ctx := ServerCtx{db}

	api.GetAppsHandler = operations.GetAppsHandlerFunc(ctx.getAppsHandler)
	api.DescribeAppHandler = operations.DescribeAppHandlerFunc(ctx.describeAppHandler)

	api.GetEnvironmentsHandler = operations.GetEnvironmentsHandlerFunc(ctx.getEnvironmentsHandler)
	api.DescribeEnvironmentHandler = operations.DescribeEnvironmentHandlerFunc(ctx.describeEnvironmentHandler)

	if *flag.Bool("init", false, "Initialize?") {
		ctx.initHandle()
		log.Fatal("Initialize end")
	}

	if err := server.Serve(); err != nil {
		log.Fatalln(err)
	}
}
