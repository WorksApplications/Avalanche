package main

import (
	"flag"
	"log"
	"os"

	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/restapi"
	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/restapi/operations"
	loads "github.com/go-openapi/loads"

	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/serverCtx"

	"database/sql"
	_ "github.com/go-sql-driver/mysql"
)

func establishDBConn(dn string) *sql.DB {
	db, err := sql.Open("mysql", dn)
	if err != nil {
		log.Fatalln("Error on db", err)
	}
	return db
}

func main() {
	log.SetPrefix("collect:\t")
	log.SetFlags(log.Lshortfile | log.Ltime | log.Ldate)

	swaggerSpec, err := loads.Embedded(restapi.SwaggerJSON, restapi.FlatSwaggerJSON)
	if err != nil {
		log.Fatalln(err)
	}

	api := operations.NewCollectAPI(swaggerSpec)

	init := flag.Bool("init", false, "Initialize?")
	dbconf := flag.String("db", "example:example@localhost?parseTime=True", "DB connexion")
	port := flag.Int("port", 4981, "Port for this server")
	slave := flag.Bool("slave", false, "Whether it works as slave (no DB update)")
	detect := flag.String("detect", "http://localhost:8080", "\"detect\" service address")
	enroll := flag.String("enroll", "http://localhost:8080", "\"enroll\" service address")
	extract := flag.String("extract", "http://localhost:8080", "\"extract\" service address")
	tempd := flag.String("volatile", "/tmp/debug-collect/collect-volatile", "\"directory for temporal file\"")
	ssstore := flag.String("persistent", "/tmp/debug-collect", "mount point of persistent volume for snapshot")
	flamescope := flag.String("flamescope", "http://flamescope.internal.worksap.com", "flamescope server location")

	flag.Parse()
	args := flag.Args()
	log.Println(args)

	/* Prepare directory for temporal directory to save perf-data (Can be missing) */
	os.MkdirAll(*tempd, 0755)

	server := restapi.NewServer(api)
	server.Port = *port
	defer server.Shutdown()

	db := establishDBConn(*dbconf)
	ctx := serverCtx.ServerCtx{
		Db:         db,
		Detect:     *detect,
		Enroll:     *enroll,
		Extract:    *extract,
		Pvmount:    *ssstore,
		Temporald:  *tempd,
		TracedPod:  make(map[int64]struct{}, 0),
		IsMaster:   !*slave,
		Flamescope: *flamescope,
		RunningPod: make(map[string]struct{}, 0),
		Ready:      false,
	}

	if *init {
		ctx.InitHandle()
		log.Fatal("Initialize end")
	}

	ctx.PollPodInfo()

	api.GetAppsHandler = operations.GetAppsHandlerFunc(ctx.GetAppsHandler)
	api.DescribeAppHandler = operations.DescribeAppHandlerFunc(ctx.DescribeAppHandler)

	api.GetEnvironmentsHandler = operations.GetEnvironmentsHandlerFunc(ctx.GetEnvironmentsHandler)
	api.DescribeEnvironmentHandler = operations.DescribeEnvironmentHandlerFunc(ctx.DescribeEnvironmentHandler)

	api.GetPodsHandler = operations.GetPodsHandlerFunc(ctx.GetPodsHandler)
	api.DescribePodHandler = operations.DescribePodHandlerFunc(ctx.DescribePodHandler)

	api.NewSnapshotHandler = operations.NewSnapshotHandlerFunc(ctx.NewSnapshotHandler)
	api.ShowSnapshotsOfPodHandler = operations.ShowSnapshotsOfPodHandlerFunc(ctx.ShowSnapshotsOfPodHandler)
	api.ListSnapshotsHandler = operations.ListSnapshotsHandlerFunc(ctx.ListSnapshotsHandler)
	api.GetSnapshotHandler = operations.GetSnapshotHandlerFunc(ctx.GetSnapshotHandler)

	api.ListAvailablePodsHandler = operations.ListAvailablePodsHandlerFunc(ctx.ListAvailablePods)

	api.HealthzHandler = operations.HealthzHandlerFunc(ctx.HealthzHandler)

	if err := server.Serve(); err != nil {
		log.Fatalln(err)
	}
}
