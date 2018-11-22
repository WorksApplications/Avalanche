package stack

import (
	"encoding/json"
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

func Filter(input []byte) ([]byte, error) {
	tree, err := readRaw(input)
	if err != nil {
		log.Print("[stack] Parse error: ", err)
		return nil, err
	}
	m, _ := newNameVec(tree)
	b, err := json.Marshal(tree.process(nil, &m))
	if err != nil {
		log.Print("[stack] Marshal error: ", err)
		return b, err
	}

	return b, nil
}

func (r *Stack) process(parent *Stack, ndic *nameMap) *Stack {
	if r.Name == "Interpreter" {
		/* Try elimination */
		e := tryEliminateInterpreter(r, ndic)
		if e != nil {
			/* Merge this into similar named node */
			if delegate(r, e) {

				/* Everything was delegated, so this is
				 * eliminatable. omit appending */
				return r
			} else {
				/* proceed to processing for rest of the children */
			}
		}
	}
	cs := make([]Stack, 0, len(r.Children))
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

		k := r.Children[i].process(r, ndic)
		if k != nil {
			cs = append(cs, *k)
		}
	}

	/* Adopt orphans */
	for _, c := range r.adoptees {
		k := c.process(r, ndic)
		if k != nil {
			cs = append(cs, *k)
		}
	}
	r.Children = cs
	return r
}

func assignCode(frame *Stack, name, mode, template string) {
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
	for i := range cur.Parent.Parent.Parent.Children {
		for j := range cur.Parent.Parent.Parent.Children[i].Children {
			e := searchSimilarStack(cur, cur.Parent.Parent.Parent.Children[i].Children[j].Children, ndic)
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
	log.Print(divestedVal)
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
