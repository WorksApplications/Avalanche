package scanner

import (
	"reflect"
	"testing"
)

func TestToMatch(t *testing.T) {
	k := []string{"env", "app"}
	u := []struct {
		t       string
		expectk []string
		expectm string
	}{
		{"$env", []string{"env"}, "%s"},
		{"node-$env", []string{"env"}, "node-%s"},
		{"kubernetes-$env", []string{"env"}, "kubernetes-%s"},
		{"k8s-$env-staging", []string{"env"}, "k8s-%s-staging"},
		{"docker-$env-$app", []string{"env", "app"}, "docker-%s-%s"},
		{"$app", []string{"app"}, "%s"},
		{"app$app", []string{"app"}, "app%s"},
		{"app-$app", []string{"app"}, "app-%s"},
	}
	for _, u := range u {
		m := toMatch(u.t, k)
		if m.match != u.expectm {
			t.Fatal(m)
		}
		if !reflect.DeepEqual(m.key, u.expectk) {
			t.Fatal(m)
		}
	}
}

func TestTokenize(t *testing.T) {
	path := "logs/node-$env/var/log/$any/app-$app/perf-log"
	u := []struct {
		expectk []string
		expectm string
	}{
		{[]string{}, "logs"},
		{[]string{"env"}, "node-%s"},
		{[]string{}, "var"},
		{[]string{}, "log"},
		{[]string{"any"}, "%s"},
		{[]string{"app"}, "app-%s"},
		{[]string{}, "perf-log"},
	}
	ts := tokenize(path)
	for i, u := range u {
		if ts[i].match != u.expectm {
			t.Fatal(ts[i])
		}
		if !reflect.DeepEqual(ts[i].key, u.expectk) {
			t.Fatal(ts[i])
		}
	}
}

func TestTokenizeNoMatch(t *testing.T) {
	path := "logs/node-$env/var/not-a-logs/$any/app-$app/perf-log"
	u := []struct {
		expectk []string
		expectm string
	}{
		{[]string{}, "logs"},
		{[]string{"env"}, "node-%s"},
		{[]string{}, "var"},
		{[]string{}, "log"},
		{[]string{"any"}, "%s"},
		{[]string{"app"}, "app-%s"},
		{[]string{}, "perf-log"},
	}
	fail := false
	ts := tokenize(path)
	for i, u := range u {
		if ts[i].match != u.expectm {
			fail = true
		}
		if !reflect.DeepEqual(ts[i].key, u.expectk) {
			fail = true
		}
	}
	if !fail {
		t.Fatal(ts)
	}
}

func TestTokenizeDoubleSlash(t *testing.T) {
	path := "logs/node-$env//var/log/$any/app-$app/perf-log"
	u := []struct {
		expectk []string
		expectm string
	}{
		{[]string{}, "logs"},
		{[]string{"env"}, "node-%s"},
		{[]string{}, ""},
		{[]string{}, "var"},
		{[]string{}, "log"},
		{[]string{"any"}, "%s"},
		{[]string{"app"}, "app-%s"},
		{[]string{}, "perf-log"},
	}
	ts := tokenize(path)
	for i, u := range u {
		if ts[i].match != u.expectm {
			t.Fatal(ts[i])
		}
		if !reflect.DeepEqual(ts[i].key, u.expectk) {
			t.Fatal(ts[i])
		}
	}
}

func TestMatch(t *testing.T) {
	path := "logs/log/node-$env/node-$env///$any/app-$app"
	m := tokenize(path)
	u := []struct {
		t     string
		dict  map[string]string
		match bool
	}{
		{"logs", map[string]string{}, true},
		{"logs", map[string]string{}, false},
		{"node-123", map[string]string{"env": "123"}, true},
		{"node123", map[string]string{"env": "123"}, false},
		{"", map[string]string{"env": "123"}, true},
		{"test", map[string]string{"env": "123"}, false},
		{"foo", map[string]string{"env": "123", "any": "foo"}, true},
		{"app-recommender", map[string]string{"env": "123", "any": "foo", "app": "recommender"}, true},
	}
	dict := map[string]string{}

	for i := range m {
		v, w, e := match(m[i], u[i].t, dict)
		if w != u[i].match {
			t.Fatal("1:", w, m[i], u[i], e)
		}
		if !reflect.DeepEqual(u[i].dict, v) {
			t.Fatal("2:", m[i], u[i])
		}
		dict = v
	}
}
