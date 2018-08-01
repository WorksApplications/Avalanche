package environ

import (
	"database/sql"
	"fmt"
	"log"

	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/layout"
	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/models"
	//"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/pod"
)

/* +--+----+---------------------------+
   |id|name|app_id                     |
   +--+----+---------------------------+
*/
func InitTable(db *sql.DB) {
	res, err := db.Exec(
		"CREATE TABLE environ(" +
			"id MEDIUMINT NOT NULL AUTO_INCREMENT, " +
			"name CHAR(32) NOT NULL, " +
			"addr TEXT, " +
			"PRIMARY KEY (id) " +
			")")
	log.Println(res, err)
}

func list(db *sql.DB, where *string) []*models.Environment {
	rows, err := db.Query(fmt.Sprintf("SELECT id, name, FROM environ %s", *where))
	if err != nil {
		log.Fatal("ENV", err)
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
		envs = append(envs, &models.Environment{&id, 0, &name, nil})
	}
	return envs
}

func fill(s *models.Environment, db *sql.DB) {
	lays := layout.OfEnv(*s.ID, db)
	lsum := 0
	for _, l := range lays {
		lsum = lsum + int(l.Lives)
	}
	s.LiveCount = int64(lsum)
}

func ListAll(db *sql.DB) []*models.Environment {
	envs := list(db, nil)
	for _, env := range envs {
		fill(env, db)
	}
	return envs
}

func Get(db *sql.DB, n *string) *models.Environment {
	name := fmt.Sprintf("WHERE name = %s", *n)
	envs := list(db, &name)
	if len(envs) != 0 {
		return envs[0]
	} else {
		return nil
	}
}

func Set(db *sql.DB, e *models.Environment) {
	db.Query("INSERT INTO environ(name) values (?)", e.name)
}

func Describe(db *sql.DB, n *string) *models.Environment {
	name := fmt.Sprintf("WHERE name = %s", *n)
	envs := list(db, &name)
	for _, env := range envs {
		fill(env, db)
	}
	if len(envs) != 0 {
		return envs[0]
	} else {
		return nil
	}
}

func FromLayout(db *sql.DB, lay *layout.Layout) *models.Environment {
	where := fmt.Sprintf("WHERE id = %s", lay.EnvId)
	envs := list(db, &where)
	for _, env := range envs {
		fill(env, db)
	}
	if len(envs) != 0 {
		return envs[0]
	} else {
		return nil
	}
}
