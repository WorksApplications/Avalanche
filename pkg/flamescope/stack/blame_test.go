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

func TestTokenize(t *testing.T) {
	kafka := "Lorg/apache/kafka/common/metrics/MetricConfig;::quota"
	spring := "Lorg/springframework/aop/framework/ReflectiveMethodInvocation;::proceed"
	text := "Ljava/text/SimpleDateFormat;::format"
	vdso := "__vdso_gettimeofday"
	user := "_ZN2os14javaTimeMillisEv"
	ss := []struct {
		name   string
		label  string
		expect string
	}{
		{"[unknown]", "jit", "[unknown]"}, {kafka, "jit", "MetricConfig"},
		{"Interpreter", "jit", "Interpreter"}, {spring, "jit", "ReflectiveMethodInvocation"},
		{vdso, "kernel", "gettimeofday"}, {text, "jit", "SimpleDateFormat"},
		{user, "user", ""},
	}
	for _, s := range ss {
		ts := tokenize(s.name, s.label)
		if s.expect == "" {
			continue
		}
		if s.expect != ts[0] {
			t.Fatal(s, ts)
		}
	}
}
