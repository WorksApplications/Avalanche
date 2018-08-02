package app

import (
	"database/sql"
	"fmt"
	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/environments"
	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/layout"
	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/models"
	"github.com/go-openapi/strfmt"
	"log"
	"time"
)

/* +--+----+---------------------------+
   |id|name|lastseen                   |
   +--+----+---------------------------+
*/

func InitTable(db *sql.DB) {
	res, err := db.Exec(
		"CREATE TABLE app(" +
			"id MEDIUMINT NOT NULL AUTO_INCREMENT, " +
			"name CHAR(80) NOT NULL, " +
			"lastseen DATETIME, " +
			"PRIMARY KEY (id) " +
			")")
	log.Println("[DB/App]", res, err)
}

func list(db *sql.DB, where *string) []*models.App {
	rows, err := db.Query(fmt.Sprintf("SELECT id, name, lastseen FROM app %s", *where))
	if err != nil {
		log.Fatal("[DB/App] ", err)
	}
	defer rows.Close()
	apps := make([]*models.App, 0)
	for rows.Next() {
		var id int64
		var name string
		var date time.Time
		err = rows.Scan(&id, &name, &date)
		if err != nil {
			log.Print("[DB/App] Scan", err)
		}
		apps = append(apps, &models.App{nil, &id, strfmt.DateTime(date), &name})
	}
	return apps
}

func fill(db *sql.DB, s *models.App) {
	lays := layout.OfApp(db, *s.ID)
	envs := make([]*models.Environment, 0)
	for _, lay := range lays {
		envs = append(envs, environ.FromLayout(db, lay))
	}
	s.Environments = envs
}

func add(db *sql.DB, n *string, d *time.Time) {
	log.Printf("[DB/App] Storing (%s, %s)", n, d)
	db.Query("INSERT INTO app(name, lastseen) values (?, ?)", n, d)
}

func ListAll(db *sql.DB) []*models.App {
	where := ""
	apps := list(db, &where)
	for _, app := range apps {
		fill(db, app)
	}
	return apps
}

func Assign(db *sql.DB, n *string, d *time.Time) *models.App {
	g := Get(db, n)
	if g == nil && d != nil {
		add(db, n, d)
		g = Get(db, n)
	}
	return g
}

func Get(db *sql.DB, n *string) *models.App {
	name := fmt.Sprintf("WHERE name = \"%s\"", *n)
	log.Println("[DB/App]", fmt.Sprintf("%s", name))
	apps := list(db, &name)
	if len(apps) != 0 {
		return apps[0]
	} else {
		return nil
	}
}

func Describe(db *sql.DB, n *string) *models.App {
	g := Get(db, n)
	if g != nil {
		fill(db, g)
	}
	return g
}
