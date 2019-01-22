/*
 * Copyright (c) 2018 Works Applications Co., Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package main

import (
	"flag"
	"log"
	"os"

	"github.com/WorksApplications/Avalanche/generated_files/restapi"
	"github.com/WorksApplications/Avalanche/generated_files/restapi/operations"
	loads "github.com/go-openapi/loads"

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
	scanner := flag.String("scanner", "http://localhost:8080", "\"scanner\" service address")
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
	cfg := cfg{
		Db:         db,
		Scanner:    *scanner,
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
		cfg.InitHandle()
		log.Fatal("Initialize end")
	}

	cfg.PollPodInfo()

	api.GetAppsHandler = operations.GetAppsHandlerFunc(cfg.GetAppsHandler)
	api.DescribeAppHandler = operations.DescribeAppHandlerFunc(cfg.DescribeAppHandler)

	api.GetEnvironmentsHandler = operations.GetEnvironmentsHandlerFunc(cfg.GetEnvironmentsHandler)
	api.DescribeEnvironmentHandler = operations.DescribeEnvironmentHandlerFunc(cfg.DescribeEnvironmentHandler)

	api.GetPodsHandler = operations.GetPodsHandlerFunc(cfg.GetPodsHandler)
	api.DescribePodHandler = operations.DescribePodHandlerFunc(cfg.DescribePodHandler)

	api.NewSnapshotHandler = operations.NewSnapshotHandlerFunc(cfg.NewSnapshotHandler)
	api.ShowSnapshotsOfPodHandler = operations.ShowSnapshotsOfPodHandlerFunc(cfg.ShowSnapshotsOfPodHandler)
	api.ListSnapshotsHandler = operations.ListSnapshotsHandlerFunc(cfg.ListSnapshotsHandler)
	api.GetSnapshotHandler = operations.GetSnapshotHandlerFunc(cfg.GetSnapshotHandler)

	api.ListAvailablePodsHandler = operations.ListAvailablePodsHandlerFunc(cfg.ListAvailablePods)

	api.HealthzHandler = operations.HealthzHandlerFunc(cfg.HealthzHandler)

	if err := server.Serve(); err != nil {
		log.Fatalln(err)
	}
}
