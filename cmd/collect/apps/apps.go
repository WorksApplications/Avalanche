package app

import (
	"database/sql"
	"fmt"
	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/layout"
	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/models"
	"git.paas.workslan/resource_optimization/dynamic_analysis/pkg/environment"
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

func ListNames(db *sql.DB) []string {
	rows, err := db.Query("SELECT name FROM app")
	if err != nil {
		log.Fatal("[DB/App] ListName: ", err)
	}
	defer rows.Close()
	apps := make([]string, 0)
	for rows.Next() {
		var name string
		err = rows.Scan(&name)
		if err != nil {
			log.Print("[DB/App] Name Scan", err)
		}
		apps = append(apps, name)
	}
	return apps
}

func fill(db *sql.DB, s *models.App) {
	lays := layout.OfApp(db, s)
	envs := make([]*models.Environment, 0)
	for _, lay := range lays {
		envs = append(envs, environ.FromLayout(db, lay))
	}
	s.Environments = envs
}

func add(db *sql.DB, n *string, d *time.Time) error {
	log.Printf("[DB/App] Storing (%s, %s)", *n, d)
	_, err := db.Exec("INSERT INTO app(name, lastseen) values (?, ?)", n, d)
	if err != nil {
		return err
	}
	return nil
}

func update(db *sql.DB, id int64, d *time.Time) error {
	_, err := db.Exec("UPDATE app SET lastseen = ? WHERE id = ?", d, id)
	//log.Printf("[DB/App] Update: %d with lastseen = %s)", id, d)
	if err != nil {
		return err
	}
	return nil
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
	} else {
		err := update(db, *g.ID, d)
		if err != nil {
			log.Printf("[DB/App] Error to update %s, %s", *n, err)
			return nil
		}
		g.Lastseen = strfmt.DateTime(*d)
	}
	return g
}

func Get(db *sql.DB, n *string) *models.App {
	name := fmt.Sprintf("WHERE name = \"%s\"", *n)
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

func FromId(db *sql.DB, id int64) *models.App {
	wh := fmt.Sprintf("WHERE id = \"%d\"", id)
	apps := list(db, &wh)
	if len(apps) == 0 {
		return nil
	}
	return apps[0]
}
