package main

import (
	"container/list"
	"net/http"
	"log"
	"golang.org/x/net/html"
	"strings"
)

var server string = "http://mischo.internal.worksap.com/"

type Subscription struct {
	environment string
	buks        []App
}

type App struct {
	name string
	pods []Pod
}

type Pod struct {
	name string
    link string
    perfing bool
	//node string
    //namespace string
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

func findLink(site string) ([]string, error) {
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

func prefix(xs []string, prefix string) []string {
	ret := make([]string, len(xs))
	for i, x := range xs {
		ret[i] = prefix + x
	}
	return ret
}

func suffix(xs []string, suffix string) []string {
	ret := make([]string, len(xs))
	for i, x := range xs {
		ret[i] = x + suffix
	}
	return ret
}

func followLink(sites []string) ([]string, error) {
	ret := make([]string, 0)
	for _, site := range sites {
		next, err := findLink(site)
		if err != nil {
			return ret, err
		}
		ret = append(ret, prefix(next, site)...)
	}
	return ret, nil
}

func toPods(ls []string, applink string) []Pod {
    pods := make([]Pod, len(ls))
    for i, l := range ls {
        pods[i] = Pod { strings.TrimRight(l, "/"), applink + l, false }
    }
    return pods
}

func isNotFound(resp *http.Response) bool {
	z := html.NewTokenizer(resp.Body)
	for {
		tt := z.Next()
		switch {
		case tt == html.ErrorToken:
            return false
		case tt == html.StartTagToken:
			t := z.Token()
			if t.Data == "title" {
                z.Next()
                if "404 Not Found" == string(z.Text()) {
                    return true
                }
			}
		}
	}

}

func (s Subscription) Scan() ([]App, error) {
	resp, err := http.Get(server + s.environment + "/log")
	if err != nil {
		log.Fatal(err)
		return nil, err
	}
	/* Read mischo/environment */
	defer resp.Body.Close()
	z := html.NewTokenizer(resp.Body)
	log.Print("[Scan] " + s.environment)
	ns := suffix(prefix(findNode(z), server+s.environment+"/log/"), "msa/")

	/* Here it generates links like /acdev/log/kubernetes-10.207.5.30/msa/acdev/ */
	logd, err := followLink(ns)
    if err != nil {
        log.Print(s.environment + "is not mounted")
        return nil, err
    }

	/* eg: /acdev/log/kubernetes-10.207.5.30/msa/acdev/develop/ */
	log2, err := followLink(logd)
    if err != nil {
        log.Print(s.environment + "is closed")
        return nil, err
    }

    mapps := make(map[string][]Pod)
	for _, l := range log2 {
		ap, _ := findLink(l)
		for _, name := range ap {
            p, _ := findLink(l + name)
            pods := toPods(p, l + name)
            found, is := mapps[name]
            if is {
                pods = append(found, pods...)
            }
            mapps[name] = pods
		}
	}

    /* Check those pods are perf-enabled */
    apps := make([]App, 0)
    for name, pods := range mapps {
        if strings.HasPrefix(name, "batch") {
            continue
        }
        npds := make([]Pod, 0)
        for _, pod := range pods {
            con, err := http.Get(pod.link + "perf/")
            defer con.Body.Close()
            if err == nil && !isNotFound(con) {
                npds = append(npds, pod)
            }
        }

        apps = append(apps, App{ name, npds })
    }

	return apps, nil
}

func main() {
	sxs := list.New()
	s := Subscription{"acdev", nil}
	sxs.PushFront(s)

	log.SetPrefix("detect:\t")
    apps, _ := s.Scan()
    log.Print(apps)
	//http.HandleFunc("/subscription", s.Poll)
	//log.Fatal(http.ListenAndServe(":8080", nil))
}
