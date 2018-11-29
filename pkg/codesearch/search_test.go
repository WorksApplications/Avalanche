package codesearch

import (
	"testing"
	"text/template"
	"time"
)

func TestRunner(t *testing.T) {
	ch := make(chan Request)
	except := make([]string, 0)
	url, _ := template.New("url").Parse("")
	data, _ := template.New("data").Parse("")
	s := Search{url, data, Undefined, ch, except, nil}
	go s.Runner("test-1")

	token := make([]string, 0)
	rc := make(chan Result)
	s.RunReq <- Request{token, token, Undefined, rc}

	timer := time.NewTimer(1 * time.Second)

	select {
	case <-timer.C:
		t.Fatal("expired: 1 sec is too slow for dummy search")
	case <-rc:
		close(ch)
		close(rc)
		return
	}
}
