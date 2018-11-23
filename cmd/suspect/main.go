package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"

	"git.paas.workslan/resource_optimization/dynamic_analysis/pkg/flamescope/stack"

	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/models"
)

type context struct {
	collect string
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

func filter(url string) (*[]byte, error) {
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
	stack, err := stack.Filter(data, 3)
	if err != nil {
		return nil, err
	}
	return &stack, nil
}

func (ctx *context) getSnapshot(uuid string) (*[]byte, error) {
	meta, err := getMeta(ctx.collect + "/snapshots/" + uuid)
	if err != nil {
		return nil, err
	}
	data, err := filter(meta.FlamescopeLink)
	if err != nil {
		return nil, err
	}
	return data, nil
}

func (ctx *context) analyze(w http.ResponseWriter, r *http.Request) {
	log.Print(r.Proto, r.Method, ": ", r.URL, " | Header: ", r.Header)
	if r.Method == "GET" {
		data, err := ctx.getSnapshot(r.URL.Path)
		if err != nil {
			return
		}
		w.Write(*data)
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
	cli := flag.Bool("cli", false, "run as cli(don't serve)")
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
