package stack

import (
	"bytes"
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"sort"
	"strings"
	"text/template"
)

type Search struct {
	Url  *template.Template
	Post *template.Template
}

type searchResult struct {
	code []Code
	ref  string
	line int
}

type Code struct {
	Snip      string `json:"snippet"`
	Link      string `json:"link"`
	Highlight bool   `json:"highlight"`
}

type Report struct {
	Name   string  `json:"name"`
	RefUrl string  `json:"search_url"`
	Code   []Code  `json:"code"`
	Line   int     `json:"line_start_at"`
	Total  float64 `json:"total_ratio"`
	Imm    float64 `json:"immidiate_ratio"`

	Children []Report `json:"children"`
}

func getDominantNode(frame *Stack, threashold float32, maxDepth int) *Stack {
	if maxDepth < 0 {
		return frame
	}
	var choosen *Stack
	for i, c := range frame.Children {
		per := float32(c.Value) / float32(frame.Value)
		if threashold <= per {
			choosen = &frame.Children[i]
		}
	}
	if choosen == nil {
		return frame
	} else {
		return getDominantNode(choosen, threashold, maxDepth-1)
	}
}

type byValue []Stack

func (a byValue) Len() int           { return len(a) }
func (a byValue) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }
func (a byValue) Less(i, j int) bool { return a[i].Value < a[j].Value }

func sortByValue(frames *[]Stack) {
	sort.Sort(byValue(*frames))
}

func GenReport(input []byte, nLoop int, searchAPI Search) ([]byte, error) {
	tree, err := readRaw(input)
	if err != nil {
		log.Print("[stack] Parse error: ", err)
		return nil, err
	}
	var m nameMap
	for i := 0; i < nLoop; i++ {
		m, _ = newNameVec(tree)
		tree.process(nil, &m)
	}
	report := tree.toReport(searchAPI, float64(tree.Value))
	b, err := json.Marshal(report)
	if err != nil {
		log.Print("[stack] Marshal error: ", err)
		return b, err
	}

	return b, nil
}

func analyze(res string) *searchResult {
	return nil
}

func search(searchAPI Search, token []string) (*searchResult, error) {
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

func tokenize(name, label string) []string {
	switch label {
	case "jit":
		/* "This is non-authentic Java wisdom", a Duke said,
		 * Assume the last part of the FQDN is the full of information portion. */
		t := strings.Split(name, ",")
		for i := len(t)/2 - 1; i >= 0; i-- {
			opp := len(t) - 1 - i
			t[i], t[opp] = t[opp], t[i]
		}
		return append(strings.Split(t[len(t)], ";::"), t[1:]...)
	case "user":
		return strings.Split(name, "_")
	case "kernel":
		return strings.Split(name, "_")
	default:
		return strings.Split(name, ".")
	}
}

func assignCode(name, label string, searchAPI Search) ([]Code, string, int) {
	t := tokenize(name, label)
	/* Example of searchAPI */
	/* http://hound.lan.tohaheavyindustrials.com/search?files=&repos=&i=nope&q={} */
	res, err := search(searchAPI, t)
	if err != nil {
		/* XXX */
	}
	return res.code, res.ref, res.line
}

func (s *Stack) toReport(searchAPI Search, rootVal float64) Report {
	c, ref, line := assignCode(s.Name, s.Label, searchAPI)
	v := 0
	cs := make([]Report, len(s.Children))
	for i, c := range s.Children {
		cs[i] = c.toReport(searchAPI, rootVal)
		v += c.Value
	}
	node := Report{
		Name:     s.Name,
		RefUrl:   ref,
		Code:     c,
		Line:     line,
		Total:    float64(s.Value) / rootVal,
		Imm:      float64(v) / rootVal,
		Children: cs,
	}
	return node
}
