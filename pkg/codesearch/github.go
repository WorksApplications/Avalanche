package codesearch

import (
	"bytes"
	"log"
	"strings"
)

/* For reference. Not gonna tested soon... */
type github struct{}

func (s github) search(api Search, token []string) (*searchResult, error) {
	var u bytes.Buffer
	var body []byte
	/* serialize tokens */
	q := strings.Join(token, " ")
	if err := api.Url.Execute(&u, q); err != nil {
		log.Print(err)
		return nil, err
	}
	if api.Post == nil {
		// resp, err := http.Get(string(u))
		log.Fatal("not implemented: search with get method")

	}
	return analyze(string(body)), nil
}
