package main

import (
	"flag"
	"io/ioutil"
	"log"

	"git.paas.workslan/resource_optimization/dynamic_analysis/pkg/flamescope/stack"
)

func main() {
	log.SetPrefix("suspect:\t")
	log.SetFlags(log.Lshortfile | log.Ltime | log.Ldate)

	sfn := flag.String("src", "test/stack", "file to read")
	dfn := flag.String("dst", "test/filtered", "file to write")
	flag.Parse()
	args := flag.Args()
	log.Println(args)
	data, err := ioutil.ReadFile(*sfn)
	if err != nil {
		panic(err)
	}
	fil, err := stack.FilterAndExport(data)
	if err != nil {
		panic(err)
	}

	ioutil.WriteFile(*dfn, fil, 0644)
}
