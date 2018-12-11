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
	"math"
)

type nameMap map[string]int64
type nameMapRev map[int64]string

type Stack struct {
	Parent   *Stack   `json:"-"`
	CodePath []string `json:"-"`
	Children []Stack  `json:"c"`
	Label    string   `json:"l"`
	Value    int      `json:"v"`
	Name     string   `json:"n"`
	adoptees []Stack  `json:"-"`
}

type Flamegraph struct {
	Children []Flamegraph `json:"children"`
	Label    string       `json:"-"`
	Value    int          `json:"value"`
	Delta    int          `json:"delta"`
	Elided   int          `json:"elided"`
	FullVal  int          `json:"full_value"`
	Name     string       `json:"name"`
	adoptees []Flamegraph `json:"-"`
}

func exportFlameGraph(s *Stack) Flamegraph {
	cs := make([]Flamegraph, len(s.Children))
	for i, c := range s.Children {
		cs[i] = exportFlameGraph(&c)
	}
	node := Flamegraph{
		Children: cs,
		Value:    s.Value,
		Delta:    0,
		Elided:   0,
		FullVal:  0,
		Name:     s.Name,
	}
	return node
}

func readRaw(data []byte) (*Stack, error) {
	var ret Stack
	err := json.Unmarshal(data, &ret)
	if err != nil {
		return nil, err
	}
	return &ret, nil
}

func idassign(node *Stack, m *nameMap, rev *nameMapRev, idch <-chan int64) {
	if node.Name == "Interpreter" {
		/* Skip presense check assuming this is different method */
	} else if _, prs := (*m)[node.Name]; !prs {
		/* register new name */
		id := <-idch
		(*m)[node.Name] = id
		(*rev)[id] = node.Name
	}
	for i, _ := range node.Children {
		node.Children[i].Parent = node
		idassign(&node.Children[i], m, rev, idch)
	}
}

func newNameVec(root *Stack) (nameMap, nameMapRev) {
	done := make(chan struct{})
	idch := make(chan int64)
	m := make(nameMap)
	rev := make(nameMapRev)
	/* id generator */
	defer close(done)
	go func() {
		id := int64(0)
		for {
			select {
			case idch <- id:
				id++
				continue
			case <-done:
				return
			}
		}
	}()

	idassign(root, &m, &rev, idch)
	return m, rev
}

func Filter(input []byte, nLoop int) ([]byte, error) {
	tree, err := readRaw(input)
	if err != nil {
		log.Print("[stack] Parse error: ", err, string(input))
		return nil, fmt.Errorf("error: %+v\n input: %s", err, input)
	}
	var m nameMap
	for i := 0; i < nLoop; i++ {
		m, _ = newNameVec(tree)
		tree.process(nil, &m)
	}
	b, err := json.Marshal(tree)
	if err != nil {
		log.Print("[stack] Marshal error: ", err)
		return b, err
	}

	return b, nil
}

func FilterAndExport(input []byte, nLoop int) ([]byte, error) {
	tree, err := readRaw(input)
	if err != nil {
		log.Print("[stack] Parse error: ", err, string(input))
		return nil, fmt.Errorf("error: %+v\n input: %s", err, input)
	}
	var m nameMap
	for i := 0; i < nLoop; i++ {
		m, _ = newNameVec(tree)
		tree.process(nil, &m)
	}
	b, err := json.Marshal(exportFlameGraph(tree))
	if err != nil {
		log.Print("[stack] Marshal error: ", err)
		return b, err
	}

	return b, nil
}

func (r *Stack) process(parent *Stack, ndic *nameMap) {
	if r.Name == "Interpreter" {
		/* Try elimination */
		e := tryEliminateInterpreter(r, ndic)
		if e != nil {
			/* Merge this into similar named node */
			if delegate(r, e) {

				/* Everything was delegated, so this is
				 * eliminatable. omit appending */
				return
			} else {
				/* proceed to processing for rest of the children */
			}
		}
	}
	cs := make([]Stack, 0, len(r.Children)+len(r.adoptees))
	for i, _ := range r.Children {
		/* Merge his doppelganger */
		for j, _ := range r.adoptees {
			/* XXX faster merge may needed */
			if r.Children[i].Name == r.adoptees[j].Name {
				r.Children[i].Value += r.adoptees[j].Value
				/* Delegate all the children of doppelganger to him */
				r.Children[i].adoptees = append(r.Children[i].adoptees, r.adoptees[j].Children...)
				/* Delete */
				r.adoptees = append(r.adoptees[:j], r.adoptees[j+1:]...)
				break
			}
		}

		r.Children[i].process(r, ndic)
		cs = append(cs, r.Children[i])
	}

	/* Adopt orphans */
	for i := range r.adoptees {
		r.adoptees[i].process(r, ndic)
		cs = append(cs, r.adoptees[i])
	}
	r.Children = cs
	return
}

func tryEliminateInterpreter(cur *Stack, ndic *nameMap) *Stack {
	e := searchSimilarStack(cur, cur.Parent.Children, ndic)
	if e != nil {
		return e
	}
	if cur.Parent.Parent == nil {
		return nil
	} else if cur.Parent.Parent.Parent == nil {
		return nil
	}

	/* No brother? Try search cousin */
	ancestor := cur.Parent.Parent.Parent
	for i := range ancestor.Children {
		if an := ancestor.Children[i].Name; an != "Interpreter" &&
			cur.Parent.Parent.Name != "Interpreter" && an != cur.Parent.Parent.Name {
			/* This cannot be my branch family */
			continue
		}
		for j := range ancestor.Children[i].Children {
			if an := ancestor.Children[i].Children[j].Name; an != "Interpreter" &&
				cur.Parent.Name != "Interpreter" && an != cur.Parent.Name {
				/* This cannot be my branch family */
				continue
			}
			e := searchSimilarStack(cur, ancestor.Children[i].Children[j].Children, ndic)
			if e != nil {
				return e
			}
		}
	}
	return nil
}

func delegate(src *Stack, dst *Stack) bool {
	orphan := make([]Stack, 0)
	adoptee := make([]Stack, 0)
	divestedVal := 0
SEARCH:
	for _, c := range src.Children {
		/* Find my children's doppelgangers */
		if c.Name == "Interpreter" {
			goto END
		}
		for _, d := range dst.Children {
			if c.Name == d.Name {
				divestedVal += c.Value
				adoptee = append(adoptee, c)
				continue SEARCH
			}
		}
	END:
		/* No adoptor found */
		orphan = append(orphan, c)
	}
	dst.adoptees = adoptee
	src.Children = orphan

	cur := [2]*Stack{dst, src}
	for cur[0] != cur[1] {
		cur[0].Value += divestedVal
		cur[1].Value -= divestedVal
		cur[0] = cur[0].Parent
		cur[1] = cur[1].Parent
	}

	return len(orphan) == 0
}

func dist(v []float32, w []float32) float32 {
	dist := float32(0.0)
	for i, _ := range v {
		dist += v[i] * w[i]
	}
	return dist
}

func searchSimilarStack(frame *Stack, sibs []Stack, ndic *nameMap) *Stack {
	/* shallow check for a node with very similar children */
	myv := makeChildVec(frame, ndic)
	max := float32(0.7)
	var mostSimilar *Stack = nil
	/* do not take struct from range here; pointer sensitive! */
	for i := range sibs {
		if sibs[i].Name == "Interpreter" {
			/* Oh? It's me!  */
			continue
		}
		theirv := makeChildVec(&sibs[i], ndic)
		d := dist(myv, theirv)
		if max < d {
			max = d
			mostSimilar = &sibs[i]
		}
	}
	return mostSimilar
}

func makeChildVec(frame *Stack, ndic *nameMap) []float32 {
	vec := make([]float32, len(*ndic))
	l := 0
	for _, n := range frame.Children {
		l += n.Value * n.Value
	}
	length := float32(math.Sqrt(float64(l)))
	for _, n := range frame.Children {
		if n.Name == "Interpreter" {
			continue
		}
		vec[(*ndic)[n.Name]] = float32(n.Value) / length
	}
	return vec
}
