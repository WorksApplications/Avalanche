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
	hits    int `json:"hits"`
	results []struct {
		filePaths []struct {
			project  string `json:"project"`
			git_link string `json:"git_link"`
		} `json:"filePaths"`
		snippet struct {
			code string `json:"code"`
			line int    `json:"lineNumber"`
		} `json:"snippet"`
	} `json:"results"`
	took   int    `json:"took"`
	requrl string `json:"-"`
}

/*
type Code struct {
	Snip      string `json:"snippet"`
	Link      string `json:"link"`
	Highlight bool   `json:"highlight"`
}

type searchResult struct {
	Code []Code
	Ref  string
	Line int
}
*/

func getRelevantResult(i *internalResult) int {
	/* XXX */
	return 0
}

func (i *internalResult) toResult() *Result {
	p := getRelevantResult(i)
	if len(i.results) == 0 {
		return nil
	}
	log.Print(i.results)

	c := make([]Code, 1)
	c[0].Snip = i.results[p].snippet.code
	r := Result{
		Code: c,
		Ref:  i.results[p].filePaths[0].git_link,
		Line: i.results[p].snippet.line,
	}
	return &r
}

func (s internal) search(api Search, token []string) (*Result, error) {
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
	if err != nil {
		return nil, fmt.Errorf("search query failed to post: %+v (%s)", err, u)
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	err = json.Unmarshal(body, &r)
	if err != nil {
		return nil, fmt.Errorf("failed to parse search result: %+v (%s)", err, u)
	}
	return r.toResult(), nil
}
