package stack

import (
	"testing"
)

var (
    example = []byte(`{"c": [
            {"c": [], "l": "", "n": "java", "v":1},
            {"c": [{"c": [], "l": "", "n": "Interpreter", "v": 1}], "l": "", "n": "kernel", "v":3}
         ], "v": 5, "l": "", "n": "java"}`)

    long = []byte(`{ "c": [
            {"c": [
                {"c": [
                    {"c": [
                        {"c": [
                            {"c": [
                                  {"c": [], "l": "jit", "n": "[unknown]", "v": 1}
                                ],
                                "l": "jit",
                                "n": "Interpreter",
                                "v": 1
                            }
                            ],
                        "l": "jit",
                        "n": "Lsun/nio/ch/EPollSelectorImpl;::updateSelectedKeys",
                        "v": 1
                        }
                    ],
                    "l": "jit",
                    "n": "Lsun/nio/ch/EPollSelectorImpl;::doSelect",
                    "v": 5
                    }
                    ],
                    "l": "jit",
                    "n": "Lsun/nio/ch/SelectorImpl;::lockAndDoSelect",
                    "v": 5
                }
                ],
                "l": "jit",
                "n": "Interpreter",
                "v": 6
            }
            ],
            "l": "user",
            "n": "root",
            "v": 6
        }`)
)

func TestReadRaw(t *testing.T) {
	r, err := readRaw(example)
	if err != nil {
		t.Fatal(err)
	}
	if len(r.Children) != 2 {
		t.Fatal(r)
	}
}

func TestNewNameVec(t *testing.T) {
	r, err := readRaw(example)
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
	r, _ := readRaw(example)
	m, _ := newNameVec(r)
	s := r.process(nil, &m)
	if len(s.Children) != 2 {
		t.Fatal(s)
	}
}

func TestProcessWithLongerExample(t *testing.T) {
	r, _ := readRaw(long)
	m, _ := newNameVec(r)
	s := r.process(nil, &m)
	if len(s.Children[0].Children) != 1  {
		t.Fatal(s)
	}
}

func TestFilter(t *testing.T) {
	s, err := Filter(example)
	if err != nil {
		t.Fatal(err, string(s))
	}
	k, err := Filter(long)
	if err != nil {
		t.Fatal(err, string(k))
	}
}

