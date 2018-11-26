package codesearch

import (
	"text/template"
)

type Code struct {
	Snip      string `json:"snippet"`
	Link      string `json:"link"`
	Highlight bool   `json:"highlight"`
}

type EngineType int

const (
	Undefined = iota
	InternalSearch
	Github
	Gitlab
	Hound
)

type Search struct {
	Url  *template.Template
	Post *template.Template
	Type EngineType
}

type searchResult struct {
	Code []Code
	Ref  string
	Line int
}

type searchEngine interface {
	//    isMatchFeature([]byte) bool
	//    getCode([]byte) []Code
	search(Search, []string) (*searchResult, error)
}

func Run(api Search, token []string) (*searchResult, error) {
	var s searchEngine
	switch api.Type {
	default:
		fallthrough
	case InternalSearch:
		s = internal{}
	case Github:
		s = github{}
	}
	return s.search(api, token)
}
