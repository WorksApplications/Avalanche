package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strings"

	"git.paas.workslan/resource_optimization/dynamic_analysis/pkg/flamescope/stack"

	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/models"
)

type context struct {
	collect   string
	searchAPI string
}

func getMeta(url string) (*models.Snapshot, error) {
	res, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	data, err := ioutil.ReadAll(res.Body)
	res.Body.Close()
	if err != nil {
		return nil, err
	}
	if res.StatusCode != 200 {
		return nil, fmt.Errorf("Remote server %s is junk!: %s: %s", url, res.Status, string(data))
	}
	var meta models.Snapshot
	err = json.Unmarshal(data, meta)
	if err != nil {
		return nil, err
	}
	return &meta, nil
}

func getData(url string) (*[]byte, error) {
	res, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	data, err := ioutil.ReadAll(res.Body)
	res.Body.Close()
	if err != nil {
		return nil, err
	}
	if res.StatusCode != 200 {
		return nil, fmt.Errorf("Remote server %s is junk!: %s: %s", url, res.Status, string(data))
	}
	return &data, nil
}

func (ctx *context) analyze(w http.ResponseWriter, r *http.Request) {
	log.Print(r.Proto, "(", r.Method, "): ", r.URL)
	if r.Method == "GET" {
		uuid := r.URL.Path
		strings.TrimPrefix(uuid, "/stacks/")
		meta, err := getMeta(ctx.collect + "/snapshots/" + uuid)
		if err != nil {
			http.Error(w, "no such snapshot record", 404)
			return
		}
		data, err := getData(meta.FlamescopeLink)
		if err != nil {
			http.Error(w, "failed to retrieve Flamegraph data", 404)
			return
		}
		stack, err := stack.Filter(*data, 3)
		if err != nil {
			http.Error(w, "failed to process Flamegraph data", 500)
			return
		}
		w.Write(stack)
	}
}

func (ctx *context) report(w http.ResponseWriter, r *http.Request) {
	log.Print(r.Proto, "(", r.Method, "): ", r.URL)
	if r.Method == "GET" {
		uuid := r.URL.Path
		strings.TrimPrefix(uuid, "/stacks/")
		meta, err := getMeta(ctx.collect + "/snapshots/" + uuid)
		if err != nil {
			http.Error(w, "no such snapshot record", 404)
			return
		}
		data, err := getData(meta.FlamescopeLink)
		if err != nil {
			http.Error(w, "failed to retrieve Flamegraph data", 404)
			return
		}
		stack, err := stack.GenReport(*data, 3, ctx.searchAPI)
		if err != nil {
			http.Error(w, "failed to process with the data", 500)
			return
		}
		w.Write(stack)
	}
}

func serve(at, collect, api string) {
	ctx := context{collect, api}
	http.HandleFunc("/stacks/", ctx.analyze)
	http.HandleFunc("/reports/", ctx.report)
	log.Fatal(http.ListenAndServe(at, nil))
}

func main() {
	log.SetPrefix("suspect:\t")
	log.SetFlags(log.Lshortfile | log.Ltime | log.Ldate)

	sfn := flag.String("src", "test/stack", "file to read")
	dfn := flag.String("dst", "test/filtered", "file to write")
	cli := flag.Bool("cli", false, "run as cli(don't serve)")
	api := flag.String("search", "https://github.com/search/code?q={}", "source code search API")
	at := flag.String("http", "localhost:8080", "host:port")
	collect := flag.String("collect", "http://collect:8080", "location for collect")
	flag.Parse()
	args := flag.Args()
	log.Println(args)

	if !*cli {
		serve(*at, *collect, *api)
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
