package pod

import (
	"database/sql"
	"fmt"
	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/layout"
	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/models"
	"github.com/go-openapi/strfmt"
	"log"
	"time"
)

func InitTable(db *sql.DB) {
	log.Println("making pod table")
	res, err := db.Exec(
		"CREATE TABLE pod(" +
			"id MEDIUMINT NOT NULL AUTO_INCREMENT, " +
			"name CHAR(128) NOT NULL, " +
			"appid int, " +
			"envid int, " +
			"layid int, " +
			"address TEXT, " +
			"live boolean, " +
			"created DATETIME, " +
			"lastupdate DATETIME, " +
			"PRIMARY KEY (id) " +
			")")
	log.Println("[DB/Pod]", res, err)
}

type PodInternal struct {
	AppId int64
	EnvId int64
	Name  string

	id      int64
	layId   int64
	created time.Time
}

func (p *PodInternal) ToResponse() *models.Pod {
	if p == nil {
		return nil
	}
	r := models.Pod{
		ID:        p.id,
		Name:      &p.Name,
		CreatedAt: strfmt.DateTime(p.created),
		IsLive:    false,
		Snapshots: nil,
	}
	return &r
}

func list(db *sql.DB, where *string, fil bool) []*PodInternal {
	rows, err := db.Query(fmt.Sprintf("SELECT id, name, appid, envid, layid, created FROM pod %s", *where))
	if err != nil {
		log.Fatal("[DB/Pod] ", err)
	}
	defer rows.Close()
	pods := make([]*PodInternal, 0)
	for rows.Next() {
		p := PodInternal{}
		err = rows.Scan(&p.id, &p.Name, &p.AppId, &p.EnvId, &p.layId, &p.created)
		if err != nil {
			log.Print(err)
			log.Print("[DB/Pod] Scan", err)
		}
		pods = append(pods, &p)
	}
	return pods
}

func ListAll(db *sql.DB) []*PodInternal {
	where := ""
	pods := list(db, &where, true)
	return pods
}

func Get(db *sql.DB, n *string, layid int64) *PodInternal {
	name := fmt.Sprintf("WHERE name = \"%s\" AND layid = \"%d\"", *n, layid)
	pods := list(db, &name, false)
	if len(pods) == 0 {
		return nil
	}
	return pods[0]
}

func FromId(db *sql.DB, id int64) *PodInternal {
	wh := fmt.Sprintf("WHERE id = \"%d\"", id)
	pods := list(db, &wh, false)
	if len(pods) == 0 {
		return nil
	}
	return pods[0]
}

func Describe(db *sql.DB, id int64) *PodInternal {
	name := fmt.Sprintf("WHERE id = \"%d\"", id)
	pods := list(db, &name, true)
	if len(pods) == 0 {
		return nil
	}
	return pods[0]
}

func add(db *sql.DB, p *string, e int64, a int64, l int64, addr *string, lud *time.Time) {
	log.Printf("[DB/Pod] Storing %s, %d, %d, %d, %s", *p, e, a, l, *addr)
	/* created means the time when it is seen firstly */
	res, err := db.Exec("INSERT INTO pod(name, envid, appid, layid, address, created, lastupdate) values (?, ?, ?, ?, ?, ?, ?)",
		*p, e, a, l, *addr, lud, lud)
	if err != nil {
		log.Print("[DB/Pod] Error EADD ", err)
		return
	}
	log.Print("[DB/Pod] OKADD", res)
}

func update(db *sql.DB, p *string, e int64, a int64, l int64, addr *string, lud *time.Time) {
	log.Printf("[DB/Pod] Storing %s, %d, %d, %d, %s", *p, e, a, l, *addr)
	res, err := db.Exec("UPDATE pod SET address=?, last_update=? WHERE name=? AND layid=?", *addr, *lud, *p, l)
	if err != nil {
		log.Print("[DB/Pod] Error UPD ", err)
		return
	}
	log.Print("[DB/Pod] OKUPD ", res)
}

func Assign(db *sql.DB, p *string, e int64, a int64, l int64, addr *string, lud *time.Time) *PodInternal {
	g := Get(db, p, l)
	if g == nil {
		add(db, p, e, a, l, addr, lud)
		g = Get(db, p, l)
	} else {
		update(db, p, e, a, l, addr, lud)
	}
	return g
}

func FromLayout(db *sql.DB, lay *layout.Layout) []*PodInternal {
	where := fmt.Sprintf("WHERE layid = \"%d\"", lay.Id)
	pods := list(db, &where, true)
	return pods
}

func ToLogAddress(db *sql.DB, id int64) string {
	var addr string
	err := db.QueryRow("SELECT address FROM pod WHERE id = ?", id).Scan(&addr)
	if err != nil {
		log.Fatal("[DB/Pod] To Address", err)
	}
	return addr
}
