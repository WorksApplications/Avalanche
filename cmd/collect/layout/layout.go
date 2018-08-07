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

func OfApp(db *sql.DB, appid int64) []*Layout {
	where := fmt.Sprintf("WHERE appId = \"%d\"", appid)
	return of(db, &where)
}

func OfEnv(db *sql.DB, envid int64) []*Layout {
	where := fmt.Sprintf("WHERE envid = \"%d\"", envid)
	return of(db, &where)
}

func add(db *sql.DB, envid int64, appid int64) {
	log.Printf("[DB/Layout] Storing (%d, %d)", envid, appid)
	db.Query("INSERT INTO layout(envid, appid, lives) values (?, ?, ?)", envid, appid, 0)
}

func Assign(db *sql.DB, envid int64, appid int64) *Layout {
	l := OfBoth(db, envid, appid)
	if l == nil {
		add(db, envid, appid)
		l = OfBoth(db, envid, appid)
	}
	return l
}

func OfBoth(db *sql.DB, envid int64, appid int64) *Layout {
	where := fmt.Sprintf("WHERE envid = \"%d\" AND appid = \"%d\"", envid, appid)
	l := of(db, &where)
	if len(l) > 1 {
		log.Printf("[DB/Layout] @@@@INCONSISTENT@@@@: couple of env: %d, app: %d has %s pairs!", envid, appid, len(l))
	}
	if len(l) == 0 {
		return nil
	}
	return l[0]
}
