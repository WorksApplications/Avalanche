package scanner

import (
	"fmt"
	"sort"
	"strings"
	"time"
)

/*
type ScanInfo struct {
	Date     time.Time       `json:"start_time"`
	Duration time.Duration   `json:"scan_duration"`
	Period   time.Duration   `json:"period"`
	Subs     []*Subscription `json:"environments"`
}
*/

type Subscription struct {
	Env     string `json:"environment"`
	Apps    []App  `json:"apps"`
	OnGoing bool   `json:"-"`
}

type App struct {
	Name string    `json:"name"`
	Pods []Pod     `json:"pods"`
	Seen time.Time `json:"last_seen"`
}

type Pod struct {
	Name       string     `json:"name"`
	Link       string     `json:"link"`
	Profiling  bool       `json:"profiled"`
	LastUpdate *time.Time `json:"last_update"`
}

type Scanner interface {
	Scan(env string) ([]App, error)
}

type Driver interface {
	list(target string) []string
}

type matchToken struct {
	key   []string
	match string
}

type key struct {
	k string
	i int
}

type byIdx []key

func (a byIdx) Len() int           { return len(a) }
func (a byIdx) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }
func (a byIdx) Less(i, j int) bool { return a[i].i < a[j].i }

func toMatch(t string, varname []string) matchToken {
	k := make([]key, 0)

	for _, v := range varname {
		if strings.Contains(t, "$"+v) {
			k = append(k, key{v, strings.Index(t, "$"+v)})
			t = strings.Replace(t, "$"+v, "%s", 1)
		}
	}

	sort.Sort(byIdx(k))

	ks := make([]string, len(k))
	for i, k := range k {
		ks[i] = k.k
	}

	return matchToken{
		key:   ks,
		match: t,
	}
}

func tokenize(template string) []matchToken {
	t := strings.Split(template, "/")
	r := make([]matchToken, len(t))
	keys := []string{"node", "env", "app", "pod", "any"}
	for i, u := range t {
		r[i] = toMatch(u, keys)
	}
	return r
}

type scanCur struct {
	// Found keywords
	found map[string]string
	// Current path cursor
	path string
	// Rest of matchTokens
	matcher []matchToken
}

func match(m matchToken, cand string, dict map[string]string) (map[string]string, bool, error) {
	s := make([]string, len(m.key))
	r := make([]interface{}, len(m.key))
	for i := range s {
		r[i] = &s[i]
	}
	n, err := fmt.Sscanf(cand, m.match, r...)
	if err == nil && len(m.key) == 0 {
		return dict, m.match == cand, nil
	} else if err == nil {
		// copy dict
		newdict := make(map[string]string)
		for k, v := range dict {
			newdict[k] = v
		}
		for i := range m.key {
			newdict[m.key[i]] = s[i]
		}
		return newdict, true, nil
	} else if err.Error() == "unexpected EOF" {
		return dict, false, err
	} else if n != len(m.key) {
		return dict, false, err
	}
	return dict, false, err
}

func run(s scanCur, driver Driver) []scanCur {
	if len(s.matcher) == 0 {
		return []scanCur{s}
	}
	/* get all children */
	list := driver.list(s.path)
	next := make([]scanCur, 0, len(list))
	/* let's see if those children mathes the next token */
	for _, path := range list {
		f, g, err := match(s.matcher[0], path, s.found)
		if err != nil {
			return []scanCur{}
		}
		if g {
			s := scanCur{
				found:   f,
				path:    s.path + "/" + path,
				matcher: s.matcher[1:],
			}
			next = append(next, s)
		}
	}
	r := make([]scanCur, 0)
	for i := range next {
		r = append(r, run(next[i], driver)...)
	}
	return r
}

func toApp(s []scanCur) []App {
	// key is appname
	pods := make(map[string][]Pod)
	for _, c := range s {
		pod := Pod{
			Name:      c.found["pod"],
			Link:      c.path,
			Profiling: true,
		}
		appname := c.found["app"]
		p, prs := pods[appname]
		if !prs {
			pods[appname] = make([]Pod, 1)
			pods[appname][0] = pod
		} else {
			pods[appname] = append(p, pod)
		}
	}
	apps := make([]App, 0, len(pods))
	for k, p := range pods {
		apps = append(apps, App{
			Name: k,
			Pods: p,
		})
	}
	return apps
}

func Scan(root, path string, driver Driver) ([]App, error) {
	tokens := tokenize(path)
	cur := scanCur{
		found:   map[string]string{},
		path:    root,
		matcher: tokens,
	}
	r := run(cur, driver)
	return toApp(r), nil
}
