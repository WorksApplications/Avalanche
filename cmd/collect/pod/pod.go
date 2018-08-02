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

type SnapSummary struct {
	id         int       `json:"id"`
	created_at time.Time `json:"created_at"`
}

func InitTable(db *sql.DB) {
	db.QueryRow(
		"CREATE TABLE pod(" +
			"id MEDIUMINT NOT NULL AUTO_INCREMENT, " +
			"name CHAR(128) NOT NULL, " +
			"appid int, " +
			"envid int, " +
			"layid int, " +
			"address string, " +
			"live boolean, " +
			"created DATETIME, " +
			"PRIMARY KEY (id) " +
			")")
}

func list(db *sql.DB, where *string) []*models.Pod {
	rows, err := db.Query(fmt.Sprintf("SELECT id, name, appid, envid, layid, live, created FROM pod %s", *where))
	if err != nil {
		log.Fatal(err)
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
		var live bool
		err = rows.Scan(&id, &name, &appid, &envid, &layid, &live, &created)
		if err != nil {
			log.Print(err)
		}
		pods = append(pods, &models.Pod{strfmt.DateTime(created), live, &name, nil})
	}
	return pods
}

func fill(db *sql.DB, s *models.Pod) {
}

func ListAll(db *sql.DB) []*models.Pod {
	pods := list(db, nil)
	for _, pod := range pods {
		fill(db, pod)
	}
	return pods
}

func Get(db *sql.DB, n *string) *models.Pod {
	name := fmt.Sprintf("WHERE name = %s", n)
	pods := list(db, &name)
	if len(pods) == 0 {
		return nil
	}
	return pods[0]
}

func add(db *sql.DB, p *string, e int64, a int64, l int64) {
	db.Query("INSERT INTO pod(name, envid, appid, layid) values (?, ?, ?, ?)", p, e, a, l)
}

func Describe(db *sql.DB, n *string) *models.Pod {
	name := fmt.Sprintf("WHERE name = %s", n)
	pods := list(db, &name)
	if len(pods) == 0 {
		return nil
	}
	fill(db, pods[0])
	return pods[0]
}

func Assign(db *sql.DB, p *string, e int64, a int64, l int64) *models.Pod {
	g := Get(db, p)
	if g == nil {
		add(db, p, e, a, l)
		g = Get(db, p)
	}
	return g
}

func FromLayout(db *sql.DB, lay *layout.Layout) []*models.Pod {
	where := fmt.Sprintf("WHERE layid = %s", lay.Id)
	pods := list(db, &where)
	for _, pod := range pods {
		fill(db, pod)
	}
	return pods
}
