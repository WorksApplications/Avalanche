package stack

import (
	"testing"
)

func TestReadRaw(t *testing.T) {
	example := []byte(`{"c": [{"c": [], "l": "", "n": "java", "v":1}, {"c": [], "l": "", "n": "kernel", "v":3}], "v": 5, "l": "", "n": "java"}`)
	_, err := readRaw(example)
	if err != nil {
		t.Fatal(err)
	}
}

func TestIntoStack(t *testing.T) {
	example := []byte(`{"c": [{"c": [], "l": "", "n": "java", "v":1}, {"c": [], "l": "", "n": "kernel", "v":3}], "v": 5, "l": "", "n": "java"}`)
	r, _ := readRaw(example)
    r.intoStack(nil)
}
