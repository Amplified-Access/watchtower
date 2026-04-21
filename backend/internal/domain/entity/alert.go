package entity

import "time"

type AlertFrequency string

const (
	FrequencyImmediate AlertFrequency = "immediate"
	FrequencyHourly    AlertFrequency = "hourly"
	FrequencyDaily     AlertFrequency = "daily"
)

type LocationPreference struct {
	Name    string   `json:"name"`
	Lat     float64  `json:"lat"`
	Lon     float64  `json:"lon"`
	Radius  float64  `json:"radius"`
	Admin1  *string  `json:"admin1,omitempty"`
	Country *string  `json:"country,omitempty"`
}

type AlertSubscription struct {
	ID                  string
	Email               string
	Name                *string
	Phone               *string
	IncidentTypes       []string
	Locations           []LocationPreference
	SeverityLevels      []string
	EmailNotifications  bool
	SMSNotifications    bool
	AlertFrequency      AlertFrequency
	IsActive            bool
	PreferredLanguage   string
	Timezone            string
	CreatedAt           time.Time
	UpdatedAt           time.Time
}

type AlertStats struct {
	Total    int `json:"total"`
	Active   int `json:"active"`
	Inactive int `json:"inactive"`
}
