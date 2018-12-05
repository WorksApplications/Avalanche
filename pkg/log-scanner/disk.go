package scanner

import (
	"io/ioutil"
	"strings"
)

type Disk struct {
	RootDir string
	NReq    int
}

func (s *Disk) list(dir string) []string {
	sub, _ := ioutil.ReadDir(s.RootDir + "/" + dir)
	s.NReq++
	ret := make([]string, 0, len(sub))
	for _, s := range sub {
		ret = append(ret, strings.TrimRight(s.Name(), "/"))
	}
	return ret
}

func (s *Disk) nReq() int {
	return s.NReq
}
