package stack

import (
	"testing"
)

func example() []byte {
    example := []byte(
    `{"c": [
        {"c": [], "l": "", "n": "java", "v":1},
        {"c": [{"c": [], "l": "", "n": "Interpreter", "v": 1}], "l": "", "n": "kernel", "v":3}
     ], "v": 5, "l": "", "n": "java"}`)
     return example
}

func TestReadRaw(t *testing.T) {
	r, err := readRaw(example())
	if err != nil {
		t.Fatal(err)
	}
    if len(r.Children) != 2 {
		t.Fatal(r)
    }
}

func TestNewNameVec(t *testing.T) {
	r, err := readRaw(example())
	if err != nil {
		t.Fatal(err)
	}
    t.Log(r)
    m, rev := newNameVec(r)
    if len(m) != len(rev) {
        t.Fatalf("Dictionaries are inconsistent: %v, %v", m, rev)
    }
    if len(m) != 2 {
        t.Fatalf("Unmatch with the example, map: %+v, rev: %+v", m, rev)
    }
}

func TestProcess(t *testing.T) {
	r, _ := readRaw(example())
    m, _:= newNameVec(r)
    s := r.process(nil, &m)
    if len(s.Children) != 2 {
		t.Fatal(s)
    }
}

