/*
 * Copyright (c) 2018 Works Applications Co., Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package scanner

import (
	"io/ioutil"
	"strings"
)

type Disk struct {
	RootDir string
	NReq    int
}

func (s *Disk) list(dir string) []path {
	sub, _ := ioutil.ReadDir(s.RootDir + "/" + dir)
	s.NReq++
	ret := make([]path, 0, len(sub))
	for _, s := range sub {
		p := path{strings.TrimRight(s.Name(), "/"), s.ModTime(), s.IsDir()}
		ret = append(ret, p)
	}
	return ret
}

func (s *Disk) nReq() int {
	return s.NReq
}
