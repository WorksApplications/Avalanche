package stack

import (
	"encoding/json"
	"testing"
)

func TestGetDominantNode(t *testing.T) {
	r, _ := readRaw(tower)
	m, _ := newNameVec(r)
	r.process(nil, &m)
	m, _ = newNameVec(r)
	r.process(nil, &m)
	if node := getDominantNode(r, 0.6, 128); node.Name != "Lsun/nio/ch/EPollSelectorImpl;::doSelect" {
		t.Log("getDominantNode is broken: ")
		b, err := json.MarshalIndent(node, " ", "    ")
		if err != nil {
			t.Log("Marshal Failed!", node)
		} else {
			t.Log(string(b))
		}
		t.Fatal()
	}
}
