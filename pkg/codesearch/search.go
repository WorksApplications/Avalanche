package codesearch

import (
	"text/template"
)

type EngineType int

const (
	Undefined = iota
	InternalSearch
	Github
	Gitlab
	Hound
)

type Search struct {
	Url   *template.Template
	Post  *template.Template
	Type  EngineType
	Count chan []string
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

func (api Search) Run(token []string) (*Result, error) {
	var s searchEngine
	switch api.Type {
	default:
		fallthrough
	case InternalSearch:
		s = internal{}
		api.Count <- token
	case Github:
		s = github{}
	case Undefined:
		s = dummy{}
	}
	return s.search(api, token)
}
