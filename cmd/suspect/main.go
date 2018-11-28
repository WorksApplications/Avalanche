package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
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
	err = json.Unmarshal(data, &meta)
	if err != nil {
		return nil, fmt.Errorf("error: %+v\n data: %s", err, string(data))
	}
	return &meta, nil
}

func getData(fu, start, end string) (*[]byte, error) {
	// http://flamescope/#/heatmap/collabo-54448bd996-xtrk5%2F61%2F8b997a66-d61c-4846-b0b9-44f7da612143
	// |
	// V
	// http://flamescope/stack/?filename=collabo-54448bd996-xtrk5%2F61%2F8b997a66-d61c-4846-b0b9-44f7da612143&start=...
	u, err := url.Parse(fu)
	if err != nil {
		return nil, err
	}
	q := u.Query()
	filename := strings.TrimPrefix(u.Fragment, "/heatmap/")
	q.Set("filename", filename)
	q.Set("start", start)
	q.Set("end", end)
	u.Path = u.Path + "stack/"
	u.RawQuery = q.Encode()
	res, err := http.Get(u.String())
	if err != nil {
		return nil, fmt.Errorf("Request failed with %+v (%s)<-(%s)", err, u, fu)
	}
	data, err := ioutil.ReadAll(res.Body)
	res.Body.Close()
	if err != nil {
		return nil, err
	}
	if res.StatusCode != 200 {
		return nil, fmt.Errorf("Remote server %s is junk!: %s: %s", u, res.Status, string(data))
	}
	return &data, nil
}

func genericHandler(w http.ResponseWriter, r *http.Request, prefix, collect string) *[]byte {
	log.Print(r.Proto, "(", r.Method, "): ", r.URL.Path)
	if r.Method == "GET" {
		uuid := r.URL.Path
		q := r.URL.Query()
		start := q.Get("start")
		end := q.Get("end")

		meta, err := getMeta(collect + "/snapshots/" + strings.TrimPrefix(uuid, prefix))
		if err != nil {
			http.Error(w, fmt.Sprintf("no such snapshot record: %+v (%+v)", err, meta), 404)
			return nil
		}
		data, err := getData(meta.FlamescopeLink, start, end)
		if err != nil {
			http.Error(w, fmt.Sprintf("failed to retrieve Flamegraph data: %+v (%+v)", err, meta), 404)
			return nil
		}
		return data
	}
	return nil
}

func (cfg *config) analyze(w http.ResponseWriter, r *http.Request) {
	data := genericHandler(w, r, "/stacks/", cfg.collect)
	if data == nil {
		return
	}

	stack, err := stack.Filter(*data, 3)
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to process Flamegraph data: %+v", err), 500)
		return
	}
	w.Write(stack)
}

func (cfg *config) report(w http.ResponseWriter, r *http.Request) {
	data := genericHandler(w, r, "/reports/", cfg.collect)
	if data == nil {
		return
	}

	stack, err := stack.GenReport(*data, 3, cfg.searchAPI)
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to process Flamegraph data: %+v", err), 500)
		return
	}
	w.Write(stack)
}

func serve(at, collect string, api codesearch.Search) {
	cfg := config{collect, api}
	http.HandleFunc("/stacks/", cfg.analyze)
	http.HandleFunc("/reports/", cfg.report)
	log.Fatal(http.ListenAndServe(at, nil))
    close(api.RunReq)
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
	case "dummy":
		engine = codesearch.Undefined
	default:
		log.Fatal("No API kind", *apitype)
	}

	ch := make(chan codesearch.Request, 512)
    except := make([]string, 0)
    s := codesearch.Search{urltempl, datatempl, engine, ch, except}
    for i := 0; i < 4; i ++ {
        go s.Runner(fmt.Sprintf("s%d", i))
    }
    return s
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
