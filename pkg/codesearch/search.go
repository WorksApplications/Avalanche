package codesearch

import (
	"bytes"
	"io/ioutil"
	"log"
	"net/http"
	"strings"
	"text/template"
)

type Code struct {
	Snip      string `json:"snippet"`
	Link      string `json:"link"`
	Highlight bool   `json:"highlight"`
}

type Search struct {
	Url  *template.Template
	Post *template.Template
}

type searchResult struct {
	Code []Code
	Ref  string
	Line int
}

func analyze(res string) *searchResult {
	return nil
}

func Run(searchAPI Search, token []string) (*searchResult, error) {
	var u bytes.Buffer
	var d bytes.Buffer
	var body []byte
	/* serialize tokens */
	q := strings.Join(token, " ")
	if err := searchAPI.Url.Execute(&u, q); err != nil {
		log.Print(err)
		return nil, err
	}
	if searchAPI.Post == nil {
		// resp, err := http.Get(string(u))
		log.Fatal("not implemented: search with get method")

	} else {
		if err := searchAPI.Post.Execute(&d, q); err != nil {
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
