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
			Project string `json:"project"`
			GitLink string `json:"git_link"`
		} `json:"filePaths"`
		Snippet struct {
			Code string `json:"code"`
			Line int    `json:"lineNumber"`
		} `json:"snippet"`
	} `json:"results"`
	Took   int    `json:"took"`
	Requrl string `json:"-"`
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
	if len(i.Results) == 0 {
		return nil
	}
	log.Print(i.Results)

	c := make([]Code, 1)
	c[0].Snip = i.Results[p].Snippet.Code
	r := Result{
		Code: c,
		Ref:  i.Results[p].FilePaths[0].GitLink,
		Line: i.Results[p].Snippet.Line,
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
	if err != nil || resp.StatusCode != 200 {
		return nil, fmt.Errorf("search query failed to post: %+v (%s){%+v}", err, u.String(), resp)
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	err = json.Unmarshal(body, &r)
	if err != nil {
		return nil, fmt.Errorf("failed to parse search result: %+v (%s)", err, u.String())
	}
	return r.toResult(), nil
}
