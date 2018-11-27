package codesearch

import (
	"bytes"
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
	took int `json:"took"`
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

func analyze(res string) *searchResult {
	return nil
}

func (s internal) search(api Search, token []string) (*searchResult, error) {
	var u bytes.Buffer
	var d bytes.Buffer
	var body []byte
	/* serialize tokens */
	q := strings.Join(token, " ")
	if err := api.Url.Execute(&u, q); err != nil {
		log.Print(err)
		return nil, err
	}
	if api.Post == nil {
		// resp, err := http.Get(string(u))
		log.Fatal("not implemented: search with GET")

	} else {
		if err := api.Post.Execute(&d, q); err != nil {
			log.Print(err)
			return nil, err
		}
		/* XXX which content-type would you like? */
		resp, err := http.Post(u.String(), "application/x-www-form-urlencoded; charset=UTF-8", &d)
		if err != nil {
			log.Print(err)
			return nil, err
		}
		defer resp.Body.Close()
		body, err = ioutil.ReadAll(resp.Body)
	}
	return analyze(string(body)), nil
}
