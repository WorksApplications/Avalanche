package codesearch

import (
	"fmt"
	"github.com/patrickmn/go-cache"
	"log"
	"strings"
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
	GoCache
)

type Request struct {
	Keywords []string
	Hints    []string
	Engine   EngineType
	ResCh    chan Result
}

type Search struct {
	Url       *template.Template
	Post      *template.Template
	DefEngine EngineType   // Default Search engine
	RunReq    chan Request // a channel to pass request to request execeutors which are created outside of package
	Except    []string     // keywords not to be searched
	Cache     *cache.Cache
	MinRatio  float64
	MaxDepth  int
}

type Code struct {
	Snip      string `json:"snippet"`
	Link      string `json:"link"`
	Highlight bool   `json:"highlight"`
}

type Result struct {
	Code  []Code
	Ref   string
	Line  int
	Found bool
	Err   error
}

type searchEngine interface {
	//    isMatchFeature([]byte) bool
	//    getCode([]byte) []Code
	// getcached...
	search(Search, []string, []string) (*Result, error)
}

type dummy struct{}

func (s dummy) search(api Search, token, hints []string) (*Result, error) {
	r := Result{
		Code: make([]Code, 0),
		Ref:  "",
		Line: 0,
	}
	return &r, nil
}

type fillingCache struct {
	cache  cache.Cache
	filler EngineType
}

func (s fillingCache) search(api Search, token, hints []string) (*Result, error) {
	q := strings.Join(token, "+")
	if v, found := s.cache.Get(q); found {
		//log.Print("[cache] hit: k=", q)
		if r, ok := v.(Result); ok {
			return &r, nil
		} else {
			return nil, fmt.Errorf("undecodable cache was hit: k=%s", q)
		}
	} else {
		r, err := api.run(token, hints, s.filler, Undefined)
		if err != nil {
			return nil, err
		}
		if r == nil {
			log.Print("[search bug] Result must not be nil unless with err", token)
			return nil, nil
		}
		//log.Print("[cache] set: k=", q, r)
		s.cache.Set(q, *r, cache.DefaultExpiration)
		return r, nil
	}
}

func isIn(except, words []string) bool {
	for _, e := range except {
		for _, w := range words {
			if e == w {
				return true
			}
		}
	}
	return false
}

func (api Search) Runner(name string) {
	c := 0
	for r := range api.RunReq {
		var err error
		var res *Result
		if isIn(api.Except, r.Keywords) {
			r.ResCh <- Result{
				Code: make([]Code, 0),
				Ref:  "",
				Line: 0,
				Err:  fmt.Errorf("Skipped"),
			}
			continue
		}
		t := time.Now()
		if api.Cache != nil {
			res, err = api.run(r.Keywords, r.Hints, GoCache, r.Engine)
		} else {
			res, err = api.run(r.Keywords, r.Hints, r.Engine, Undefined)
		}

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
			c++
			log.Printf("[search runner %s:%d] Elapsed %v", name, c, time.Since(t))
		}
	}
}

func (api Search) run(token, hints []string, e, fe EngineType) (*Result, error) {
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
	case GoCache:
		s = fillingCache{*api.Cache, fe}
	}
	return s.search(api, token, hints)
}
