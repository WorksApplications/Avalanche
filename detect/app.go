package main

import (
	"container/list"
	"net/http"
	//"fmt"
	"log"
	//"io/ioutil"
	//"bytes"
	"golang.org/x/net/html"
	"strings"
)

var prefix string = "http://mischo.internal.worksap.com/"

type Subscription struct {
	environment string
	buks        []Node
}

type Node struct {
	dir  string
	apps []App
}

type App struct {
	name string
	pods []Pods
}

type Pods struct {
	name string
	node Node
}

func findNode(z *html.Tokenizer) []string {
	var ns []string
	for {
		tt := z.Next()
		switch {
		case tt == html.ErrorToken:
			return ns
		case tt == html.StartTagToken:
			t := z.Token()
			if t.Data == "a" {
				for _, attr := range t.Attr {
					if strings.HasPrefix(attr.Val, "kubernetes") {
						ns = append(ns, attr.Val)
						log.Print("\t[Found] " + attr.Val)
						continue
					}
				}
			}
		}
	}
	return ns
}

func findLink(site string, debug bool) ([]string, error) {
	if debug {
		log.Print(site)
	}
	resp, err := http.Get(site)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	z := html.NewTokenizer(resp.Body)

	var lxs []string
	for {
		tt := z.Next()
		switch {
		case tt == html.ErrorToken:
			return lxs, nil
		case tt == html.StartTagToken:
			t := z.Token()
			if t.Data == "a" {
				for _, attr := range t.Attr {
					if attr.Key == "href" && attr.Val != "../" {
						lxs = append(lxs, attr.Val)
					}
				}
			}
		}
	}
	return lxs, nil
}

func addPrefix(xs []string, prefix string) []string {
	ret := make([]string, len(xs))
	for i, x := range xs {
		ret[i] = prefix + x
	}
	return ret
}

func followLink(sites []string, linkgen func(string) string) ([]string, error) {
	ret := make([]string, 0)
	for _, site := range sites {
		link := linkgen(site)
		next, err := findLink(link, false)
		if err != nil {
			return ret, err
		}
		ret = append(ret, addPrefix(next, link)...)
	}
	return ret, nil
}

func (s Subscription) Scan() (*App, error) {
	resp, err := http.Get(prefix + s.environment + "/log")
	if err != nil {
		log.Fatal(err)
		return nil, err
	}
	/* Read mischo/environment */
	defer resp.Body.Close()
	z := html.NewTokenizer(resp.Body)
	log.Print("[Scan] " + s.environment)
	ns := addPrefix(findNode(z), prefix+s.environment+"/log/")

	/* Here it generates links like /acdev/log/kubernetes-10.207.5.30/msa/acdev/ */
	logd, _ := followLink(ns, func(l string) string { return l + "msa/" })

	/* eg: /acdev/log/kubernetes-10.207.5.30/msa/acdev/develop/ */
	ls, _ := followLink(logd, func(l string) string { return l })

	for _, l := range ls {
		log.Print(l)
		apps, _ := findLink(l, false)
		for _, a := range apps {
			log.Print(a)
		}
	}
	return nil, nil
}

func main() {
	sxs := list.New()
	s := Subscription{"acdev", nil}
	sxs.PushFront(s)

	log.SetPrefix("collect:\t")
	s.Scan()
	//http.HandleFunc("/subscription", s.Poll)
	//log.Fatal(http.ListenAndServe(":8080", nil))
}
