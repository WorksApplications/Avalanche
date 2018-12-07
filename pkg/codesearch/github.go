/*
 * Copyright (c) 2017 Works Applications Co., Ltd.
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
	"bytes"
	"fmt"
	"log"
	"strings"
)

/* For reference. Not gonna tested soon... */
type github struct{}

func (s github) search(api Search, token, hints []string) (*Result, error) {
	var u bytes.Buffer
	//var body []byte
	/* serialize tokens */
	q := strings.Join(token, " ")
	if err := api.Url.Execute(&u, q); err != nil {
		log.Print(err)
		return nil, err
	}
	// resp, err := http.Get(string(u))
	return nil, fmt.Errorf("not implemented: search with github")

	//return analyze(string(body)), nil
}
