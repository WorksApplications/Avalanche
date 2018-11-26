package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strings"
	"text/template"

	"git.paas.workslan/resource_optimization/dynamic_analysis/pkg/codesearch"
	"git.paas.workslan/resource_optimization/dynamic_analysis/pkg/flamescope/stack"

	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/models"
)

type config struct {
	collect   string
	searchAPI codesearch.Search
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

func (cfg *config) analyze(w http.ResponseWriter, r *http.Request) {
	log.Print(r.Proto, "(", r.Method, "): ", r.URL)
	if r.Method == "GET" {
		uuid := r.URL.Path
		meta, err := getMeta(cfg.collect + "/snapshots/" + strings.TrimPrefix(uuid, "/stacks/"))
		if err != nil {
			http.Error(w, fmt.Sprintf("no such snapshot record: %+v", err), 404)
			return
		}
		data, err := getData(meta.FlamescopeLink)
		if err != nil {
			http.Error(w, fmt.Sprintf("failed to retrieve Flamegraph data: %+v", err), 404)
			return
		}
		stack, err := stack.Filter(*data, 3)
		if err != nil {
            http.Error(w, fmt.Sprintf("failed to process Flamegraph data: %+v", err), 500)
			return
		}
		w.Write(stack)
	}
}

func (cfg *config) report(w http.ResponseWriter, r *http.Request) {
	log.Print(r.Proto, "(", r.Method, "): ", r.URL)
	if r.Method == "GET" {
		uuid := r.URL.Path
		meta, err := getMeta(cfg.collect + "/snapshots/" + strings.TrimPrefix(uuid, "/stacks/"))
		if err != nil {
			http.Error(w, fmt.Sprintf("no such snapshot record: %+v", err), 404)
			return
		}
		data, err := getData(meta.FlamescopeLink)
		if err != nil {
			http.Error(w, fmt.Sprintf("failed to retrieve Flamegraph data: %+v", err), 404)
			return
		}
		stack, err := stack.GenReport(*data, 3, cfg.searchAPI)
		if err != nil {
            http.Error(w, fmt.Sprintf("failed to process Flamegraph data: %+v", err), 500)
			return
		}
		w.Write(stack)
	}
}

func serve(at, collect string, api codesearch.Search) {
	cfg := config{collect, api}
	http.HandleFunc("/stacks/", cfg.analyze)
	http.HandleFunc("/reports/", cfg.report)
	log.Fatal(http.ListenAndServe(at, nil))
}

func toSearch(apiurl, apipost, apitype *string) codesearch.Search {
	var urltempl *template.Template
	var datatempl *template.Template
	var engine codesearch.EngineType
	urltempl, err := template.New("url").Parse(*apiurl)
	if err != nil {
		log.Fatal("Parse error at reading \"-apiurl\" flag", err)
	}
	if *apipost != "" {
		datatempl, err = template.New("data").Parse(*apipost)
		if err != nil {
			log.Fatal("Parse error at reading \"-apipost\" flag", err)
		}
	}

	switch *apitype {
	case "github":
		engine = codesearch.Github
	case "hound":
		engine = codesearch.Hound
	case "gitlab":
		engine = codesearch.Gitlab
	case "internal-use":
		engine = codesearch.InternalSearch
	default:
		log.Fatal("No API kind", *apitype)
	}
	return codesearch.Search{urltempl, datatempl, engine}
}

func main() {
	log.SetPrefix("suspect:\t")
	log.SetFlags(log.Lshortfile | log.Ltime | log.Ldate)

	sfn := flag.String("src", "test/stack", "file to read")
	dfn := flag.String("dst", "test/filtered", "file to write")
	cli := flag.Bool("cli", false, "run as cli(don't serve)")
	apiurl := flag.String("searchUrl", "https://github.com/search/code?q={{.}}", "source code search API")
	apipost := flag.String("searchPost", "", "The data to send to the source code search API if it requires \"POST\" (empty indicates \"GET\").")
	apitype := flag.String("searchType", "github", "type of the search engine. \"github\", \"gitlab\", \"hound\", \"internal-use\"")
	at := flag.String("http", "localhost:8080", "host:port")
	collect := flag.String("collect", "http://collect:8080", "location for collect")
	flag.Parse()
	args := flag.Args()
	log.Println(args)

	if !*cli {
		serve(*at, *collect, toSearch(apiurl, apipost, apitype))
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
