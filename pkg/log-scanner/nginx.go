package scanner

import (
	"log"
	"net/http"
	"strings"
	"time"

	"golang.org/x/net/html"
)

type Nginx struct {
	Server string
	NReq   int
}

func findNode(z *html.Tokenizer, prefix string) []string {
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
					if strings.HasPrefix(attr.Val, prefix) {
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

	var links []string
	for {
		tt := z.Next()
		switch {
		case tt == html.ErrorToken:
			return links, nil
		case tt == html.StartTagToken:
			t := z.Token()
			if t.Data == "a" {
				for _, attr := range t.Attr {
					if attr.Key == "href" && attr.Val != "../" {
						links = append(links, attr.Val)
					}
				}
			}
		}
	}
	return links, nil
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
	t := time.Now()
	for i, l := range ls {
		pods[i] = Pod{strings.TrimRight(l, "/"), applink + l, false, &t}
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

func (s *Nginx) list(dir string) []string {
	links, err := findLink(s.Server + "/" + dir)
	s.NReq++
	if err != nil {
		log.Print(s.Server+"/"+dir, links, err)
		return []string{}
	}
	for i := range links {
		links[i] = strings.TrimRight(links[i], "/")
	}
	return links
}

func (s *Nginx) nReq() int {
	return s.NReq
}

/* Currently, the implementation is very relying on the structure of our internal staging evironments.
 * The structure is such:
 * http://<log-proxy>/<environment-name>/log/<hostname-of-node>/msa/<environment-code>/<stage>/

 * The implementation is not needed to follow this structure, but it is left as-is for now.
 */
func (s Nginx) Scan(dir string) ([]App, error) {
	log.Print("[Scan] " + dir)
	resp, err := http.Get(s.Server + "/" + dir + "/log")
	requested := 1
	defer func() { log.Printf("total request: %d", requested) }()
	if err != nil {
		log.Fatal(err)
		return nil, err
	}
	/* Read mischo/environment */
	defer resp.Body.Close()
	z := html.NewTokenizer(resp.Body)
	ns := suffix(prefix(findNode(z, "kubernetes"), s.Server+dir+"/log/"), "msa/")

	/* Here it generates links like /acdev/log/kubernetes-10.207.5.30/msa/acdev/ */
	logd, err := followLink(ns)
	requested += len(logd)
	if err != nil {
		log.Print(dir + "is not mounted")
		return nil, err
	}

	/* eg: /acdev/log/kubernetes-10.207.5.30/msa/acdev/develop/ */
	log2, err := followLink(logd)
	requested += len(log2)
	if err != nil {
		log.Print(dir + "is closed")
		return nil, err
	}

	mapps := make(map[string][]Pod)
	for _, l := range log2 {
		ap, _ := findLink(l)
		for _, name := range ap {
			p, _ := findLink(l + name)
			pods := toPods(p, l+name)
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
		name = strings.TrimRight(name, "/")

		npds := make([]Pod, 0)
		for _, pod := range pods {
			requested += 1
			con, err := http.Get(pod.Link + "perf-record/")
			if err != nil {
				log.Print("HTTP error", err)
			}
			defer con.Body.Close()
			if err == nil && !isNotFound(con) {
				pod.Profiling = true
				npds = append(npds, pod)
			}
		}

		apps = append(apps, App{name, npds, time.Now()})
	}

	return apps, nil
}
