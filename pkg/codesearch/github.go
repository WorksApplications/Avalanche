package codesearch

import (
	"bytes"
	"fmt"
	"log"
	"strings"
)

/* For reference. Not gonna tested soon... */
type github struct{}

func (s github) search(api Search, token, hints []string) (*Result, error) {
	var u bytes.Buffer
	//var body []byte
	/* serialize tokens */
	q := strings.Join(token, " ")
	if err := api.Url.Execute(&u, q); err != nil {
		log.Print(err)
		return nil, err
	}
	// resp, err := http.Get(string(u))
	return nil, fmt.Errorf("not implemented: search with github")

	//return analyze(string(body)), nil
}
