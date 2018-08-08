package pod

import (
	"database/sql"
	"fmt"
	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/layout"
	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/models"
	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/environments"
	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/apps"
	"github.com/go-openapi/strfmt"
	"log"
	"time"
)

type SnapSummary struct {
	id         int       `json:"id"`
	created_at time.Time `json:"created_at"`
}

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
			"PRIMARY KEY (id) " +
			")")
	log.Println("[DB/Pod]", res, err)
}

func list(db *sql.DB, where *string, fil bool) []*models.Pod {
	rows, err := db.Query(fmt.Sprintf("SELECT id, name, appid, envid, layid, created FROM pod %s", *where))
	if err != nil {
		log.Fatal("[DB/Pod] ", err)
	}
	defer rows.Close()
	pods := make([]*models.Pod, 0)
	for rows.Next() {
		var id int64
		var name string
		var appid int64
		var envid int64
		var layid int64
		var created time.Time
		err = rows.Scan(&id, &name, &appid, &envid, &layid, &created)
		if err != nil {
			log.Print(err)
			log.Print("[DB/Pod] Scan", err)
		}
        e := ""
        a := ""
        if fil {
            e = *environ.FromId(db, envid).Name
            a = *app.FromId(db, appid).Name
        }
		pods = append(pods,
        &models.Pod{
            ID: id,
            Name: &name,
            CreatedAt: strfmt.DateTime(created),
            IsLive: false,
            App: a,
            Env: e,
            Snapshots: nil})
	}
	return pods
}

func ListAll(db *sql.DB) []*models.Pod {
	where := ""
	pods := list(db, &where, true)
	return pods
}

func Get(db *sql.DB, n *string, layid int64) *models.Pod {
	name := fmt.Sprintf("WHERE name = \"%s\" AND layid = \"%d\"", *n, layid)
	pods := list(db, &name, false)
	if len(pods) == 0 {
		return nil
	}
	return pods[0]
}

func FromId(db *sql.DB, id int64) *models.Pod {
	wh := fmt.Sprintf("WHERE id = \"%d\"", id)
	pods := list(db, &wh, false)
	if len(pods) == 0 {
		return nil
	}
	return pods[0]
}

func Describe(db *sql.DB, id int64) *models.Pod {
	name := fmt.Sprintf("WHERE id = \"%d\"", id)
	pods := list(db, &name, true)
	if len(pods) == 0 {
		return nil
	}
	return pods[0]
}

func add(db *sql.DB, p *string, e int64, a int64, l int64, addr *string) {
	log.Printf("[DB/Pod] Storing %s, %d, %d, %d, %s", *p, e, a, l, *addr)
    now := time.Now()
    res, err := db.Exec("INSERT INTO pod(name, envid, appid, layid, address, created) values (?, ?, ?, ?, ?, ?)", *p, e, a, l, *addr, now)
    if err != nil {
        log.Print("[DB/Pod] Error EADD", err)
    }
    log.Print("[DB/Pod] OKADD", res)
}

func Assign(db *sql.DB, p *string, e int64, a int64, l int64, addr *string) *models.Pod {
	g := Get(db, p, l)
	if g == nil {
		add(db, p, e, a, l, addr)
		g = Get(db, p, l)
	}
	return g
}

func FromLayout(db *sql.DB, lay *layout.Layout) []*models.Pod {
	where := fmt.Sprintf("WHERE layid = \"%s\"", lay.Id)
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
