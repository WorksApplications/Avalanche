package environ

import (
	"database/sql"
	"fmt"
	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/models"
	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/layout"
	"log"
)

/* +--+----+---------------------------+
   |id|name|app_id                     |
   +--+----+---------------------------+
*/
func InitTable(db *sql.DB) {
	db.QueryRow(
		"CREATE TABLE environ(" +
			"id MEDIUMINT NOT NULL AUTO_INCREMENT, " +
			"name CHAR(32) NOT NULL, " +
            "addr TEXT, " +
			"PRIMARY KEY (id) " +
			")")
}

func list(db *sql.DB, where *string) []*models.Environment {
	rows, err := db.Query("SELECT id, name, FROM environ ?", where)
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()
	envs := make([]*models.Environment, 0)
	for rows.Next() {
		var id int64
		var name string
		err = rows.Scan(&id, &name)
		if err != nil {
			log.Print(err)
		}
        lays := layout.OfEnv(id, db)
        lsum := 0
        for _, l := range *lays {
            lsum = lsum + int(l.Lives)
        }
		envs = append(envs, &models.Environment{&id, int64(lsum), &name, nil})
	}
	return envs
}

func fill(s *models.Environment, db *sql.DB) {
	//idwhere := fmt.Sprintf("WHERE appId = %s", s.ID)
	//s.Environments = environ.List(db, &idwhere)
}

func ListAll(db *sql.DB) []*models.Environment {
	envs := list(db, nil)
	for _, env := range envs {
		fill(env, db)
	}
	return envs
}

func Describe(db *sql.DB, n *string) *models.Environment {
	name := fmt.Sprintf("WHERE name = %s", n)
	envs := list(db, &name)
	for _, env := range envs {
		fill(env, db)
	}
	return envs[0]
}

func FromLayout(db *sql.DB, lay *layout.Layout) *models.Environment {
	where := fmt.Sprintf("WHERE id = %s", lay.EnvId)
	envs := list(db, &where)
	for _, env := range envs {
		fill(env, db)
	}
	return envs[0]
}
