package main

import (
	"flag"
	"io/ioutil"
	"log"
	"net/http"

	"git.paas.workslan/resource_optimization/dynamic_analysis/pkg/flamescope/stack"
)

type context struct {
	collect string
}

func (ctx *context) getSnapshots(uuid string) {
	http.Get(ctx.collect + "/snapshots/" + uuid)
}

func (ctx *context) analyze(w http.ResponseWriter, r *http.Request) {
	log.Print(r.Proto, r.Method, ": ", r.URL, " | Header: ", r.Header)
	if r.Method == "POST" {
	}
}

func serve(at, collect string) {
	ctx := context{collect}
	http.HandleFunc("/", ctx.analyze)
	log.Fatal(http.ListenAndServe(at, nil))
}

func main() {
	log.SetPrefix("suspect:\t")
	log.SetFlags(log.Lshortfile | log.Ltime | log.Ldate)

	sfn := flag.String("src", "test/stack", "file to read")
	dfn := flag.String("dst", "test/filtered", "file to write")
	at := flag.String("http", "localhost:8080", "host:port")
	collect := flag.String("collect", "http://collect:8080", "location for collect")
	flag.Parse()
	args := flag.Args()
	log.Println(args)

	if at != nil {
		serve(*at, *collect)
	} else {
		data, err := ioutil.ReadFile(*sfn)
		if err != nil {
			panic(err)
		}
		fil, err := stack.FilterAndExport(data, 2)
		if err != nil {
			panic(err)
		}

		ioutil.WriteFile(*dfn, fil, 0644)
	}
}
