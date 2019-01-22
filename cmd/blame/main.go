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
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"strings"
	"text/template"
	"time"

	"github.com/patrickmn/go-cache"

	"github.com/WorksApplications/Avalanche/pkg/codesearch"
	"github.com/WorksApplications/Avalanche/pkg/flamescope/stack"

	"github.com/WorksApplications/Avalanche/generated_files/models"
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
	t := time.Now()
	data := genericHandler(w, r, "/reports/", cfg.collect)
	if data == nil {
		return
	}
	log.Print("report: get data", time.Since(t))
	t = time.Now()

	stack, err := stack.GenReport(*data, 3, cfg.searchAPI)
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to process Flamegraph data: %+v", err), 500)
		return
	}
	log.Print("report: gen report", time.Since(t))
	w.Write(stack)
}

func serve(at, collect string, api codesearch.Search) {
	cfg := config{collect, api}
	http.HandleFunc("/stacks/", cfg.analyze)
	http.HandleFunc("/reports/", cfg.report)
	log.Fatal(http.ListenAndServe(at, nil))
	close(api.RunReq)
}

func toSearch(apiurl, apipost, apitype, except *string, nsw, maxdepth int, minratio float64) codesearch.Search {
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

	ch := make(chan codesearch.Request, nsw)
	s := codesearch.Search{
		Url:       urltempl,
		Post:      datatempl,
		DefEngine: engine,
		RunReq:    ch,
		Except:    strings.Split(*except, ","),
		Cache:     cache.New(8*time.Hour, 1*time.Hour),
		MinRatio:  minratio,
		MaxDepth:  maxdepth,
	}
	for i := 0; i < nsw; i++ {
		go s.Runner(fmt.Sprintf("s%d", i))
	}
	return s
}

func main() {
	log.SetFlags(log.Lshortfile | log.Ltime | log.Ldate)

	nsw := flag.Int("nSearchWorker", 1, "number of workers for searching")
	sfn := flag.String("src", "test/stack", "file to read")
	dfn := flag.String("dst", "test/filtered", "file to write")
	cli := flag.Bool("cli", false, "run as cli(don't serve)")
	except := flag.String("except", "sun,tomcat", "Keywords not for search with your repository(exact match with a token(eg: each part of FQDN for Java))")
	apiurl := flag.String("searchUrl", "https://github.com/search/code?q={{.}}", "source code search API")
	apipost := flag.String("searchPost", "", "The data to send to the source code search API if it requires \"POST\" (empty indicates \"GET\").")
	apitype := flag.String("searchType", "github", "type of the search engine. \"github\", \"gitlab\", \"hound\", \"internal-use\"")
	maxdepth := flag.Int("searchMaxDepth", 4, "Search worker constraint: The max depth from the closed-up node to be searched")
	minratio := flag.Float64("searchMinRatio", 0.1, "Search worker constraint: The minimum number of ratio to be searched")
	http := flag.String("http", ":8080", "host:port")
	collect := flag.String("collect", "http://collect:8080", "location for collect")
	flag.Parse()
	args := flag.Args()
	log.Println(args)

	if !*cli {
		serve(*http, *collect, toSearch(apiurl, apipost, apitype, except, *nsw, *maxdepth, *minratio))
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
