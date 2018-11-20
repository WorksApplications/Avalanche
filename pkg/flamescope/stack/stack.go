package stack

import (
	"encoding/json"
    "math"
)

type nameMap map[string]int64
type nameMapRev map[int64]string

type Stack struct {
	Children []Stack
	Parent   *Stack
	Name     string
	CodePath []string
    Value    int
}

type rawStack struct {
	Children []rawStack `json:"c"`
	Label    string     `json:"l"`
	Value    int        `json:"v"`
	Name     string     `json:"n"`
}

func readRaw(data []byte) (*rawStack, error) {
	var ret rawStack
	err := json.Unmarshal(data, &ret)
	if err != nil {
		return nil, err
	}
	return &ret, nil
}

func idassign (node *rawStack, m *nameMap, rev *nameMapRev, idch <-chan int64) {
    if node.Name == "Interpreter" {
        /* Skip presense check assuming this is different method */
    } else if _, prs := (*m)[node.Name]; !prs {
        /* register new name */
        id := <- idch
        (*m)[node.Name] = id
        (*rev)[id] = node.Name
    }
    for _, c := range node.Children {
        idassign(&c, m, rev, idch)
    }
}

func newNameVec(root *rawStack) (nameMap, nameMapRev) {
    done := make(chan struct{})
    idch := make(chan int64)
    m := make(nameMap)
    rev := make(nameMapRev)
    /* id generator */
    defer close(done)
    go func () {
        id := int64(0)
        for {
            select {
            case idch <- id:
                id ++
                continue
            case <-done:
                return
            }
        }
    }()

    idassign(root, &m, &rev, idch)
    return m, rev
}

func (r *rawStack) intoStack(parent *Stack, ndic *nameMap) Stack {
	me := Stack{
		Parent: parent,
		Name:   r.Name,
	}
	cs := make([]Stack, len(r.Children))
	for i, c := range r.Children {
		cs[i] = c.intoStack(&me, ndic)
		if c.Name == "Interpreter" {
			tryEliminateInterpreter(&cs[i], ndic)
		}
	}
    me.Children = cs
	return me
}

func assignCode(frame *Stack, name, mode, template string) {
}

func merge(*Stack, *Stack) {
}

func tryEliminateInterpreter(frame *Stack, ndic *nameMap) {
    sim := searchSimilarStack(frame, frame.Parent.Children, ndic)
    if sim == nil {
        /* leave as is */
        return
    } else {
        merge(frame, sim)
    }
}

func dist(v []float32, w []float32) float32 {
    return 0.0
}

func searchSimilarStack(frame *Stack, sibs []Stack, ndic *nameMap) *Stack {
    /* shallow check for a node with very similar children */
    myv := makeChildVec(frame, ndic)
    for _, sib := range sibs {
        theirv := makeChildVec(&sib, ndic)
        d := dist(myv, theirv)
    }
    return nil
}

func makeChildVec(frame *Stack, ndic *nameMap) []float32 {
    vec := make([]float32, len(*ndic))
    l := 0
    for _, n := range frame.Children {
        l += n.Value * n.Value
    }
    length := float32(math.Sqrt(float64(l)))
    for _, n := range frame.Children {
        vec[(*ndic)[n.Name]] = float32(n.Value) / length
    }
    return vec
}
