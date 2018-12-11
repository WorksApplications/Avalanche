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
package codesearch

import (
	"testing"
	"text/template"
	"time"
)

func TestRunner(t *testing.T) {
	ch := make(chan Request)
	except := make([]string, 0)
	url, _ := template.New("url").Parse("")
	data, _ := template.New("data").Parse("")
	s := Search{url, data, Undefined, ch, except, nil, 0.1, 4}
	go s.Runner("test-1")

	token := make([]string, 0)
	rc := make(chan Result)
	s.RunReq <- Request{token, token, Undefined, rc}

	timer := time.NewTimer(1 * time.Second)

	select {
	case <-timer.C:
		t.Fatal("expired: 1 sec is too slow for dummy search")
	case <-rc:
		close(ch)
		close(rc)
		return
	}
}
