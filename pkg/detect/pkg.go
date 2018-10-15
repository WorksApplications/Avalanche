package detect

import (
	"time"
)

type ScanInfo struct {
	Date     time.Time       `json:"start_time"`
	Duration time.Duration   `json:"scan_duration"`
	Period   time.Duration   `json:"period"`
	Subs     []*Subscription `json:"environments"`
}

type Subscription struct {
	Env     string `json:"environment"`
	Apps    []App  `json:"apps"`
	OnGoing bool   `json:"-"`
}

type App struct {
	Name string    `json:"name"`
	Pods []Pod     `json:"pods"`
	Seen time.Time `json:"last_seen"`
}

type Pod struct {
	Name       string     `json:"name"`
	Link       string     `json:"link"`
	Profiling  bool       `json:"profiled"`
	LastUpdate *time.Time `json:"last_update"`
	//node string
	//namespace string
}
