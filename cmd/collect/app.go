package main

import (
	"log"
    "flag"

	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/restapi"
	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/restapi/operations"
	loads "github.com/go-openapi/loads"
	middleware "github.com/go-openapi/runtime/middleware"

	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/apps"
	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/environments"
    "database/sql"
    _ "github.com/go-sql-driver/mysql"
)

type ServerCtx struct {
    Db *sql.DB
}

func (s *ServerCtx) getAppHandler(_ operations.GetAppsParams) middleware.Responder {
    body := app.ListAll(s.Db)
    return operations.NewGetAppsOK().WithPayload(body)
}

func (s *ServerCtx) describeAppHandler(params operations.DescribeAppParams) middleware.Responder {
    body := app.Describe(s.Db, &params.Appid)
    return operations.NewDescribeAppOK().WithPayload(body)
}

func (s *ServerCtx) initHandle() {
    app.InitTable(s.Db)
    environ.InitTable(s.Db)
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

    api.GetAppsHandler = operations.GetAppsHandlerFunc(ctx.getAppHandler)
    api.DescribeAppHandler = operations.DescribeAppHandlerFunc(ctx.describeAppHandler)

    if *flag.Bool("init", false, "Initialize?") {
        ctx.initHandle()
        log.Fatal("Initialize end")
    }

	if err := server.Serve(); err != nil {
		log.Fatalln(err)
	}
}

