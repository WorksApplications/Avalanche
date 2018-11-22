package stack

import (
	"encoding/json"
	"testing"
)

var (
	example = []byte(`{"c": [
            {"c": [], "l": "", "n": "java", "v":1},
            {"c": [{"c": [], "l": "", "n": "Interpreter", "v": 1}], "l": "", "n": "kernel", "v":3}
         ], "v": 5, "l": "", "n": "java"}`)

	tower = []byte(`{ "c": [
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

	wider = []byte(`{ "c": [
            {"c": [
                {"c": [{
                        "l": "jit",
                        "n": "Lsun/nio/ch/EPollSelectorImpl;::doSelect",
                        "v": 5,
                        "c": []
                    }
                    ],
                "l": "jit",
                "n": "Lsun/nio/ch/SelectorImpl;::lockAndDoSelect",
                "v": 5
                },
                {"c": [],
                 "n": "Ljava/util/concurrent/SynchronousQueue$TransferStack;::transfer",
                 "l": "jit",
                 "v": 3
                }
            ],
            "l": "jit",
            "n": "Interpreter",
            "v": 9
            },
            {"c": [
                {"c": [{
                        "l": "jit",
                        "n": "Lsun/nio/ch/EPollSelectorImpl;::doSelect",
                        "v": 9,
                        "c": []
                    }
                    ],
                "l": "jit",
                "n": "Lsun/nio/ch/SelectorImpl;::lockAndDoSelect",
                "v": 9
                }],
            "l": "jit",
            "n": "Lorg/apache/tomcat/util/net/NioBlockingSelector$BlockPoller;::run",
            "v": 10
            }
            ],
            "l": "user",
            "n": "root",
            "v": 19
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
	r, _ := readRaw(tower)
	m, _ := newNameVec(r)
	s := r.process(nil, &m)
	if len(s.Children[0].Children) != 1 {
		t.Fatal(s)
	}
}

func TestProcessWithWiderExample(t *testing.T) {
	r, _ := readRaw(wider)
	m, _ := newNameVec(r)
	s := r.process(nil, &m)
	adoptor := -1
	if len(s.Children) == 0 {
		goto ERR
	}
	for i, a := range s.Children {
		if a.Name == "Interpreter" {
			adoptor = i
		}
	}
	if adoptor == -1 {
		t.Log("No Interpreter")
		goto ERR
	}
	/* Confirm Interpreter has only one child */
	if len(s.Children[adoptor].Children) != 1 || s.Children[adoptor].Children[0].Value != 3 {
		t.Log("Interpreter has no child (it should have an unique child actually)", s.Children[adoptor].Children[0])
		goto ERR
	}

	for i, a := range s.Children {
		if a.Name != "Interpreter" {
			adoptor = i
		}
	}

	if adoptor == -1 {
		t.Log("No JIT-ed method")
		goto ERR
	}

	if len(s.Children[adoptor].Children) != 1 {
		t.Log("Failed to raise my child =(")
		goto ERR
	}
	if s.Children[adoptor].Value != 15 {
		t.Log("No additional time given by adopt")
		goto ERR
	}
	if s.Children[adoptor].Children[0].Value != 14 {
		t.Log("No additional time given by adopt for children")
		goto ERR
	}
	return
ERR:
	b, err := json.MarshalIndent(s, " ", "    ")
	if err != nil {
		t.Fatal("[stack] Marshal error: ", err)
	}
	t.Fatal(string(b))
}

func TestFilter(t *testing.T) {
	s, err := Filter(example, 3)
	if err != nil {
		t.Fatal(err, string(s))
	}
	k, err := Filter(tower, 3)
	if err != nil {
		t.Fatal(err, string(k))
	}
}
