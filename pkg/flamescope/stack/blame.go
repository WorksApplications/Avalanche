/*
 * Copyright (c) 2018 Works Applications Co., Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package stack

import (
	"encoding/json"
	"fmt"
	"log"
	"sort"
	"strings"

	"git.paas.workslan/resource_optimization/dynamic_analysis/pkg/codesearch"
)

type Report struct {
	Name   string  `json:"name"`
	RefUrl string  `json:"search_url"`
	Link   string  `json:"primary_link"`
	Line   int     `json:"line_start_at"`
	Label  string  `json:"label"`
	Total  float64 `json:"total_ratio"`
	Imm    float64 `json:"immediate_ratio"`

	Code []codesearch.Code `json:"code"`

	Children []Report `json:"children"`
}

func getDominantNode(frame *Stack, threashold float32, maxDepth int) *Stack {
	if maxDepth < 0 {
		return frame
	}
	var choosen *Stack
	sortByValue(&frame.Children)
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
func (a byValue) Less(i, j int) bool { return a[i].Value > a[j].Value }

func sortByValue(frames *[]Stack) {
	sort.Sort(byValue(*frames))
}

func GenReport(input []byte, nLoop int, searchAPI codesearch.Search) ([]byte, error) {
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
	tree = getDominantNode(tree, 0.7, 100)
	report := tree.toReport(searchAPI, float64(tree.Value), searchAPI.MaxDepth)
	b, err := json.Marshal(report)
	if err != nil {
		log.Print("[stack] Marshal error: ", err)
		return b, err
	}

	return b, nil
}

func tokenize(name, label string) []string {
	var t []string
	switch label {
	case "jit":
		/* "This is non-authentic Java wisdom", a Duke said,
		 * Assume the last part of the FQDN is the portion with full of information. */
		t = strings.Split(name, "/")
	case "user":
		t = strings.Split(name, "_")
	case "kernel":
		t = strings.Split(name, "_")
	default:
		t = strings.Split(name, ".")
	}
	for i := len(t)/2 - 1; i >= 0; i-- {
		opp := len(t) - 1 - i
		t[i], t[opp] = t[opp], t[i]
	}
	return append(strings.Split(t[0], ";::"), t[1:]...)
}

func (s *Stack) toReport(api codesearch.Search, rootVal float64, depth int) Report {
	v := 0
	var res codesearch.Result
	eng := api.DefEngine
	switch s.Name {
	case "[unknown]":
		fallthrough
	case "Interpreter":
		fallthrough
	case "call_stub":
		fallthrough
	case "SafepointBlob":
		eng = codesearch.Undefined
	default:
		if depth < 0 {
			eng = codesearch.Undefined
		}
	}
	if (float64(s.Value) / rootVal) < api.MinRatio {
		eng = codesearch.Undefined
	}
	switch s.Label {
	case "jit":
		if t := strings.Trim(s.Name, "[]"); fmt.Sprintf("[%s]", t) == s.Name {
			eng = codesearch.Undefined
		}
	default:
		eng = codesearch.Undefined
	}
	/* parse the name depending on the label context */
	t := tokenize(s.Name, s.Label)
	/* Example of searchAPI */
	/* http://hound.lan.tohaheavyindustrials.com/search?files=&repos=&i=nope&q={} */
	/* Brand new channel with cap=1. The search-runner can handle another request before this function receives from it,
	 * which prevent from dead-lock */
	ch := make(chan codesearch.Result, 1)

	/* search request. The result will be received after spawning children's reporting. */
	api.RunReq <- codesearch.Request{t[0:1], t[1:], eng, ch}

	cs := make([]Report, len(s.Children))
	for i, c := range s.Children {
		cs[i] = c.toReport(api, rootVal, depth-1)
		v += c.Value
	}
	res = <-ch

	close(ch)

	/* XXX: choose primary link in more reasonable way */
	link := res.Code[0].Link

	node := Report{
		Name:     s.Name,
		RefUrl:   res.Ref,
		Link:     link,
		Code:     res.Code,
		Line:     res.Line,
		Total:    float64(s.Value) / rootVal,
		Imm:      float64(s.Value-v) / rootVal,
		Children: cs,
		Label:    s.Label,
	}
	return node
}
