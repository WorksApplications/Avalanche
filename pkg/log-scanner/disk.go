package scanner

import (
	"io/ioutil"
	"log"
)

type Disk struct {
	RootDir string
	LogName string
}

func (s Disk) Scan(dir string) ([]App, error) {
	log.Print("[Scan] " + dir)
	sub, _ := ioutil.ReadDir(s.RootDir + dir)
	for _, x := range sub {
		if x.Name() == s.LogName {
		}
	}
	return make([]App, 0), nil
}
