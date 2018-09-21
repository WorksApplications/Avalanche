package snapshot

import (
	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/models"
	"github.com/DATA-DOG/go-sqlmock"
	"reflect"
	//"github.com/google/uuid"
	"encoding/json"
	"testing"
	"time"
)

func TestToResponse(t *testing.T) {
	db, mock, _ := sqlmock.New()
	//InitTable(db)
	epoch := time.Date(2018, 1, 15, 3, 0, 0, 0, time.UTC)

	pod := sqlmock.NewRows([]string{"id", "name", "appid", "envid", "layid", "created"}).AddRow(1, "collabo-bd6dc859c-f7dfm", 1, 2, 2, epoch)
	environ := sqlmock.NewRows([]string{"id", "name"}).AddRow(2, "systema")

	mock.ExpectQuery("SELECT (.+) FROM pod WHERE id = \"1\"").WillReturnRows(pod)
	mock.ExpectQuery("SELECT (.+) FROM environ WHERE id = \"2\"").WillReturnRows(environ)

	id := "d7eec7c1-daf5-4198-9503-6957aea0bf90"
	internal := SnapshotInternal{
		UUID:    id,
		appid:   1,
		podid:   1,
		envid:   2,
		layid:   2,
		link:    "collabo-bd6dc859c-f7dfm/a0/d7eec7c1-daf5-4198-9503-6957aea0bf90",
		created: epoch,
	}
	resp := internal.ToResponse(db, "http://flamescope.internal.worksap.com/#/heatmap/")
	/* This example is generated by an example in the API definitions */
	example := []byte(`{
        "createdAt": "2018-01-15T03:00:00.000Z",
        "environment": "systema",
        "flamescopeLink": "http://flamescope.internal.worksap.com/#/heatmap/collabo-bd6dc859c-f7dfm%2Fa0%2Fd7eec7c1-daf5-4198-9503-6957aea0bf90",
        "pod": "collabo-bd6dc859c-f7dfm",
        "uuid": "d7eec7c1-daf5-4198-9503-6957aea0bf90"
      }`)

	var expect models.Snapshot
	json.Unmarshal(example, &expect)
	if !reflect.DeepEqual(&expect, resp) {
		json, err := json.Marshal(resp)
		if err != nil {
			t.Fatal("Return object is not serializable")
		}

		t.Fatal("Got:", string(json), "Expected:", string(example), "\n", "Got:", resp, "Expected:", &expect)
	}
}