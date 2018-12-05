package scanner

import (
	"encoding/json"
	"fmt"
	"reflect"
	"strings"
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

type testPath struct {
	Path     string
	Children []testPath
}

func lister(p *testPath, dir []string) *testPath {
	if len(dir) == 0 {
		return p
	} else if len(dir) == 1 {
		if p.Path == dir[0] {
			return p
		} else {
			return nil
		}
	} else {
		for i := range p.Children {
			if p.Children[i].Path != dir[1] {
				continue
			}
			r := lister(&p.Children[i], dir[1:])
			if r != nil {
				return r
			}
		}
		return nil
	}
	return nil
}

func (s *testPath) list(path string) []string {
	dir := strings.Split(path, "/")
	t := lister(s, dir)
	p := t.Children
	r := make([]string, len(p))
	for i := range p {
		r[i] = p[i].Path
	}
	return r
}

func (root *testPath) nReq() int {
	return 0
}

func (root *testPath) add(rawpath string) {
	path := strings.Split(rawpath, "/")
	dir := path[0 : len(path)-1]
	p := lister(root, dir)
	if p == nil {
		fmt.Print("add pseudo path failed:\n", root, rawpath, dir)
	}
	for _, n := range p.Children {
		if n.Path == path[len(path)-1] {
			return
		}
	}
	p.Children = append(p.Children, testPath{path[len(path)-1], []testPath{}})
}

func (root *testPath) addRec(rawpath string) {
	path := strings.Split(rawpath, "/")
	made := path[0] + "/"
	for i := 1; i < len(path); i++ {
		made = made + path[i]
		fmt.Println("add:", made)
		root.add(made)
		made = made + "/"
	}
}

func TestScan(t *testing.T) {
	path := "logs/node-$any/var/log/$any/$app/$pod/perf-log"
	root := testPath{"server", []testPath{}}
	root.addRec("server/logs/node-stg/var/log/lisa/recommender/recommender-5c13933a90/perf-log")
	root.addRec("server/logs/node-stg/var/log/lisa/recommender/recommender-3ce31309f2/perf-log")
	root.addRec("server/logs/node-evl/var/log/gaspard/map/map-fe9910b219/perf-log")
	root.addRec("server/logs/node-evl/var/log/gaspard/map/map-7c780097c9/perf-log")
	root.addRec("server/logs/node-stg/var/log/lisa/map/map-c0ae432a90/perf-log")

	expected := []App{
		App{
			Name: "recommender",
			Pods: []Pod{
				Pod{
					Name:       "recommender-5c13933a90",
					Link:       "server/logs/node-stg/var/log/lisa/recommender/recommender-5c13933a90/perf-log",
					Profiling:  true,
					LastUpdate: nil,
				},
				Pod{
					Name:       "recommender-3ce31309f2",
					Link:       "server/logs/node-stg/var/log/lisa/recommender/recommender-3ce31309f2/perf-log",
					Profiling:  true,
					LastUpdate: nil,
				},
			},
		},
		App{
			Name: "map",
			Pods: []Pod{
				Pod{
					Name:       "map-c0ae432a90",
					Link:       "server/logs/node-stg/var/log/lisa/map/map-c0ae432a90/perf-log",
					Profiling:  true,
					LastUpdate: nil,
				},
				Pod{
					Name:       "map-fe9910b219",
					Link:       "server/logs/node-evl/var/log/gaspard/map/map-fe9910b219/perf-log",
					Profiling:  true,
					LastUpdate: nil,
				},
				Pod{
					Name:       "map-7c780097c9",
					Link:       "server/logs/node-evl/var/log/gaspard/map/map-7c780097c9/perf-log",
					Profiling:  true,
					LastUpdate: nil,
				},
			},
		},
	}

	json, err := json.MarshalIndent(root, "", " ")
	fmt.Println(string(json))
	fmt.Println(root.list("server"))
	fmt.Println(root.list("server/logs/node-stg/var/log/lisa/recommender"))

	apps, _, _ := Scan("server", path, &root)
	if err != nil {
		t.Fatal(err)
	}

	if !reflect.DeepEqual(apps, expected) {
		t.Log(apps[0])
		t.Log(expected[0])
		t.Log()
		t.Log(apps[1])
		t.Fatal(expected[1])
	}

}
