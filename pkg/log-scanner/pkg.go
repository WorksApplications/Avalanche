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
	List(target string) []string
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
	keys := []string{"env", "app", "pod", "any"}
	for i, u := range t {
		r[i] = toMatch(u, keys)
	}
	return r
}

type scanCur struct {
	// Found keywords
	found map[string]string
	// Current path cursor
	curr string
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
