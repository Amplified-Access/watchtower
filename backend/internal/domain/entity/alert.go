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
	ID                 string             `json:"id"`
	Email              string             `json:"email"`
	Name               *string            `json:"name,omitempty"`
	Phone              *string            `json:"phone,omitempty"`
	IncidentTypes      []string           `json:"incidentTypes,omitempty"`
	Locations          []LocationPreference `json:"locations,omitempty"`
	SeverityLevels     []string           `json:"severityLevels,omitempty"`
	EmailNotifications bool               `json:"emailNotifications"`
	SMSNotifications   bool               `json:"smsNotifications"`
	AlertFrequency     AlertFrequency     `json:"alertFrequency"`
	IsActive           bool               `json:"isActive"`
	PreferredLanguage  string             `json:"preferredLanguage"`
	Timezone           string             `json:"timezone"`
	CreatedAt          time.Time          `json:"createdAt"`
	UpdatedAt          time.Time          `json:"updatedAt"`
}

type AlertStats struct {
	Total    int `json:"total"`
	Active   int `json:"active"`
	Inactive int `json:"inactive"`
}
