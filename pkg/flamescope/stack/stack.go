package stack

import (
	"encoding/json"
)

type Stack struct {
	Children []Stack
	Parent   *Stack
	Name     string
    CodePath []string
}

type rawStack struct {
	children []rawStack `json:"c"`
	label    string     `json:"l"`
	value    string     `json:"v"`
	name     string     `json:"n"`
}

func readRaw(data []byte) (*rawStack, error) {
	var ret rawStack
	err := json.Unmarshal(data, &ret)
	if err != nil {
		return nil, err
	}
	return &ret, nil
}

func (r *rawStack) intoStack(parent *Stack) Stack {
    me := Stack {
        Parent: parent,
        Name: r.name,
    }
    cs := make([]Stack, len(r.children))
    for i, c := range r.children {
        cs[i] = c.intoStack(&me)
        if c.name == "Interpreter" {
            tryEliminateInterpreter(cs[i])
        }
    }
    return me
}

func assignCode(frame *Stack, name, mode string) {
}

func tryEliminateInterpreter(frame Stack) {
}
