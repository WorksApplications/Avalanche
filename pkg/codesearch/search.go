package codesearch

import (
	"fmt"
	"log"
	"text/template"
	"time"
)

type EngineType int

const (
	Undefined = iota
	InternalSearch
	Github
	Gitlab
	Hound
)

type Request struct {
	Keywords []string
	Engine   EngineType
	ResCh    chan Result
}

type Search struct {
	Url       *template.Template
	Post      *template.Template
	DefEngine EngineType   // Default Search engine
	RunReq    chan Request // a channel to pass request to request execeutors which are created outside of package
	Except    []string     // keywords not to be searched
}

type Code struct {
	Snip      string `json:"snippet"`
	Link      string `json:"link"`
	Highlight bool   `json:"highlight"`
}

type Result struct {
	Code []Code
	Ref  string
	Line int
	Err  error
}

type searchEngine interface {
	//    isMatchFeature([]byte) bool
	//    getCode([]byte) []Code
	search(Search, []string) (*Result, error)
}

type dummy struct{}

func (s dummy) search(api Search, token []string) (*Result, error) {
	r := Result{
		Code: make([]Code, 0),
		Ref:  "",
		Line: 0,
	}
	return &r, nil
}

func (api Search) Runner(name string) {
	for r := range api.RunReq {
		t := time.Now()
		res, err := api.run(r.Keywords, r.Engine)

		if err != nil {
			/* TODO: check remote server status */
			log.Print("[search runner]", name, err)
			res.Err = err
		}
		if res == nil {
			// No hit
			res = &Result{
				Code: make([]Code, 0),
				Ref:  "",
				Line: 0,
				Err:  fmt.Errorf("No result found"),
			}
		}
		r.ResCh <- *res
		if r.Engine != Undefined {
			log.Printf("[search runner %s] Elapsed %v", name, time.Since(t))
		}
	}
}

func (api Search) run(token []string, e EngineType) (*Result, error) {
	var s searchEngine
	switch e {
	default:
		fallthrough
	case InternalSearch:
		s = internal{}
	case Github:
		s = github{}
	case Undefined:
		s = dummy{}
	}
	return s.search(api, token)
}
