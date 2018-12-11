/*
 * Copyright (c) 2017 Works Applications Co., Ltd.
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

func findLink(site string) ([]path, error) {
	resp, err := http.Get(site)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	z := html.NewTokenizer(resp.Body)

	var links []path
	for {
		tt := z.Next()
		switch {
		case tt == html.ErrorToken:
			return links, nil
		case tt == html.StartTagToken:
			t := z.Token()
			if t.Data == "a" {
				for _, attr := range t.Attr {
					var p path
					if attr.Key == "href" && attr.Val != "../" {
						p.name = strings.TrimRight(attr.Val, "/")
						p.dir = attr.Val != p.name
					}
					/* Next should be string, I swear */
					_ = z.Next()
					d := strings.Trim(z.Token().Data, " \n-")
					nginxForm := "02-Jan-2006 03:04"
					p.date, _ = time.Parse(nginxForm, d)
					links = append(links, p)
				}
			}
		}
	}
	return links, nil
}

func (s *Nginx) list(dir string) []path {
	links, err := findLink(s.Server + "/" + dir)
	s.NReq++
	if err != nil {
		log.Print(s.Server+"/"+dir, links, err)
		return []path{}
	}
	return links
}

func (s *Nginx) nReq() int {
	return s.NReq
}
