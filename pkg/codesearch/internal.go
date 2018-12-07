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
package codesearch

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strings"
)

/* for internal, closed source code search engine */
type internal struct{}

type internalResult struct {
	Hits    int `json:"hits"`
	Results []struct {
		FilePaths []struct {
			Project  string `json:"project"`
			FilePath string `json:"file_path"`
			GitLink  string `json:"git_link"`
		} `json:"filePaths"`
		Snippet struct {
			Code string `json:"code"`
			Line int    `json:"lineNumber"`
		} `json:"snippet"`
	} `json:"results"`
	Took   int    `json:"took"`
	Requrl string `json:"-"`
}

func getRelevantResult(i *internalResult, hints []string) (int, bool) {
	/* No suitable match found */
	if len(i.Results) == 0 {
		return 0, false
	}

	max_score := 0
	ret := 0
	for i, r := range i.Results {
		score := 0
		for _, p := range r.FilePaths {
			/* For the most cases, the length of r.FilePaths is one (merely, two or three) */
			ts := strings.Split(p.FilePath, "/.")
			for _, t := range ts {
				for _, h := range hints {
					if t == h {
						score++
					}
				}
			}
		}
		if max_score < score {
			ret = i
			max_score = score
		}
	}
	/* XXX */
	return ret, true
}

func (i *internalResult) toResult(token []string) *Result {
	p, ok := getRelevantResult(i, token)

	c := make([]Code, 1)
	r := Result{
		Code:  c,
		Found: ok,
	}
	if ok {
		r.Code[0].Snip = i.Results[p].Snippet.Code
		r.Ref = i.Results[p].FilePaths[0].GitLink
		r.Line = i.Results[p].Snippet.Line
	}
	return &r
}

func (s internal) search(api Search, token, hints []string) (*Result, error) {
	var u bytes.Buffer
	var d bytes.Buffer
	var r internalResult
	/* serialize tokens */
	q := strings.Join(token, " ")
	if err := api.Url.Execute(&u, q); err != nil {
		log.Print(err)
		return nil, err
	}
	if api.Post == nil {
		// resp, err := http.Get(string(u))
		return nil, fmt.Errorf("not implemented: search with GET")
	}

	if err := api.Post.Execute(&d, q); err != nil {
		return nil, fmt.Errorf("templating error at constructing search query: %+v", err)
	}
	resp, err := http.Post(u.String(), "application/x-www-form-urlencoded; charset=UTF-8", &d)
	if err != nil || resp.StatusCode != 200 {
		return nil, fmt.Errorf("search query failed to post: %+v (%s){%+v}", err, u.String(), resp)
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	err = json.Unmarshal(body, &r)
	if err != nil {
		return nil, fmt.Errorf("failed to parse search result: %+v (%s)", err, u.String())
	}
	return r.toResult(hints), nil
}
