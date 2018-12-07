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
package layout

import (
	"database/sql"
	"fmt"
	"log"

	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/models"
)

type Layout struct {
	Id    int64
	AppId int64
	EnvId int64
	Lives int64
}

/* LAYOUT is intended to keep tuples of appid and envid, because there is app x env possibilities,
   even though the API endpoint seems to be organized /apps/<app>/envs/<env> thus environment is included by application.
   The database structure follows the real _physical_ constraint of those target applications,
   and our server returns a structure which is "resolved" as if they are inclusive relation.  */

func InitTable(db *sql.DB) {
	res, err := db.Exec(
		"CREATE TABLE layout(" +
			"id MEDIUMINT NOT NULL AUTO_INCREMENT, " +
			"name CHAR(80), " +
			"envid int, " +
			"appid int, " +
			"lives int, " +
			"PRIMARY KEY (id) " +
			")")
	log.Println("[DB/Layout]", res, err)
}

func of(db *sql.DB, where *string) []*Layout {
	rows, err := db.Query(fmt.Sprintf("SELECT id, name, appid, envid, lives FROM layout %s", *where))
	if err != nil {
		log.Fatal("[DB/Layout] ", err)
	}
	defer rows.Close()
	lays := make([]*Layout, 0)
	for rows.Next() {
		var id int64
		var aid int64
		var eid int64
		var lives int64
		var name *string
		err = rows.Scan(&id, &name, &aid, &eid, &lives)
		if err != nil {
			log.Print("[DB/Layout] Scan", err)
		}
		lays = append(lays, &Layout{id, aid, eid, lives})
	}
	return lays
}

func OfApp(db *sql.DB, app *models.App) []*Layout {
	where := fmt.Sprintf("WHERE appId = \"%d\"", *app.ID)
	return of(db, &where)
}

func OfEnv(db *sql.DB, env *models.Environment) []*Layout {
	where := fmt.Sprintf("WHERE envid = \"%d\"", *env.ID)
	return of(db, &where)
}

func add(db *sql.DB, env *models.Environment, app *models.App) {
	log.Printf("[DB/Layout] Storing (%d, %d)", *env.ID, *app.ID)
	db.Query("INSERT INTO layout(envid, appid, lives) values (?, ?, ?)", *env.ID, *app.ID, 0)
}

func Assign(db *sql.DB, env *models.Environment, app *models.App) *Layout {
	l := OfBoth(db, env, app)
	if l == nil {
		add(db, env, app)
		l = OfBoth(db, env, app)
	}
	return l
}

func OfBoth(db *sql.DB, env *models.Environment, app *models.App) *Layout {
	where := fmt.Sprintf("WHERE envid = \"%d\" AND appid = \"%d\"", *env.ID, *app.ID)
	l := of(db, &where)
	if len(l) > 1 {
		log.Printf("[DB/Layout] @@@@INCONSISTENT@@@@: couple of env: %d, app: %d has %d pairs!", *env.ID, *app.ID, len(l))
	}
	if len(l) == 0 {
		return nil
	}
	return l[0]
}
