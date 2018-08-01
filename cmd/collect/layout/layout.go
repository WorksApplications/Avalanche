package layout

import (
	"database/sql"
	"fmt"
	"log"
)

type Layout struct {
	Id    int64
	AppId int64
	EnvId int64
	Lives int64
}

func InitTable(db *sql.DB) {
	res, err := db.Exec(
		"CREATE TABLE layout(" +
			"id MEDIUMINT NOT NULL AUTO_INCREMENT, " +
			"name CHAR(80) NOT NULL, " +
			"appid int, " +
			"envid int, " +
			"lives int, " +
			"PRIMARY KEY (id) " +
			")")
	log.Println(res, err)
}

func of(where *string, db *sql.DB) []*Layout {
	rows, err := db.Query(fmt.Sprintf("SELECT id, name, appid, envid, lives FROM layout %s", *where))
	if err != nil {
		log.Fatal("LAYOUT", err)
	}
	defer rows.Close()
	lays := make([]*Layout, 0)
	for rows.Next() {
		var id int64
		var aid int64
		var eid int64
		var lives int64
		err = rows.Scan(&id, &aid, &eid, &lives)
		if err != nil {
			log.Print(err)
		}
		lays = append(lays, &Layout{id, aid, eid, lives})
	}
	return lays
}

func OfApp(appid int64, db *sql.DB) []*Layout {
	where := fmt.Sprintf("WHERE appId = %s", appid)
	return of(&where, db)
}

func OfEnv(envid int64, db *sql.DB) []*Layout {
	where := fmt.Sprintf("WHERE envid = %s", envid)
	return of(&where, db)
}

func OfBoth(envid int64, appid int64, db *sql.DB) []*Layout {
	where := fmt.Sprintf("WHERE envid = %s AND appid = %s", envid, appid)
	return of(&where, db)
}
