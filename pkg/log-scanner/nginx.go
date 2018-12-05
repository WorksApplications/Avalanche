package scanner

import (
	"log"
	"net/http"
	"strings"

	"golang.org/x/net/html"
)

type Nginx struct {
	Server string
	NReq   int
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
