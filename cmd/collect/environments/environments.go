package environ

import (
	"database/sql"
	"fmt"
	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/models"
	"log"
	"time"
)

type Env struct {
	id   int    `json:"id"`
	name string `json:"name"`
	pods *[]Pod `json:"pods"`
	live int    `json:"live_count"`
}

type Pod struct {
	id         int            `json:"id"`
	name       string         `json:"name"`
	snapshots  *[]SnapSummary `json:"snapshots"`
	is_live    bool           `json:"is_live"`
	created_at time.Time      `json:"created_at"`
}

type SnapSummary struct {
	id         int       `json:"id"`
	created_at time.Time `json:"created_at"`
}

/* +--+----+---------------------------+
   |id|name|app_id                     |
   +--+----+---------------------------+
*/
func InitTable(db *sql.DB) {
	db.QueryRow(
		"CREATE TABLE environ(" +
			"id MEDIUMINT NOT NULL AUTO_INCREMENT, " +
			"name CHAR(32) NOT NULL, " +
			"appId int, " +
			"lives int, " +
			"PRIMARY KEY (id) " +
			")")
}

func List(db *sql.DB, where *string) []*models.Environment {
	rows, err := db.Query("SELECT id, name, appId, lives FROM environ ?", where)
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()
	envs := make([]*models.Environment, 0)
	for rows.Next() {
		var id int64
		var name string
		var appId int64
		var lives int64
		err = rows.Scan(&id, &name, &appId, &lives)
		if err != nil {
			log.Print(err)
		}
		envs = append(envs, &models.Environment{appId, &id, lives, &name, nil})
		//apps = append(apps, &models.App{nil, &id, strfmt.DateTime(date), &name})
	}
	return envs
}

func fill(s *models.Environment, db *sql.DB) {
	//idwhere := fmt.Sprintf("WHERE appId = %s", s.ID)
	//s.Environments = environ.List(db, &idwhere)
}

func ListAll(db *sql.DB) []*models.Environment {
	envs := List(db, nil)
	for _, env := range envs {
		fill(env, db)
	}
	return envs
}

func Describe(db *sql.DB, n *string) *models.Environment {
	name := fmt.Sprintf("WHERE name = %s", n)
	envs := List(db, &name)
	for _, env := range envs {
		fill(env, db)
	}
	return envs[0]
}
