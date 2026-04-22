package entity

import "time"

type IncidentStatus string

const (
	IncidentReported      IncidentStatus = "reported"
	IncidentInvestigating IncidentStatus = "investigating"
	IncidentResolved      IncidentStatus = "resolved"
	IncidentClosed        IncidentStatus = "closed"
)

type Severity string

const (
	SeverityLow      Severity = "low"
	SeverityMedium   Severity = "medium"
	SeverityHigh     Severity = "high"
	SeverityCritical Severity = "critical"
)

type Location struct {
	Latitude  float64  `json:"latitude"`
	Longitude float64  `json:"longitude"`
	Address   *string  `json:"address,omitempty"`
	Country   *string  `json:"country,omitempty"`
	Name      *string  `json:"name,omitempty"`
}

type IncidentType struct {
	ID          string
	Name        string
	Description *string
	Color       string
	IsActive    bool
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type OrganizationIncidentType struct {
	ID             string
	OrganizationID string
	IncidentTypeID string
	IsEnabled      bool
	IncidentType   *IncidentType
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

type Incident struct {
	ID               string
	OrganizationID   string
	FormID           string
	ReportedByUserID string
	Data             map[string]interface{}
	Status           IncidentStatus
	CreatedAt        time.Time
	UpdatedAt        time.Time
}

type AnonymousIncidentReport struct {
	ID              string
	IncidentTypeID  string
	IncidentType    *IncidentType
	Location        Location
	Description     string
	Entities        []string
	Injuries        int
	Fatalities      int
	EvidenceFileKey *string
	AudioFileKey    *string
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

type OrganizationIncidentReport struct {
	ID               string
	OrganizationID   string
	ReportedByUserID string
	IncidentTypeID   string
	IncidentType     *IncidentType
	Location         Location
	Description      string
	Entities         []string
	Injuries         int
	Fatalities       int
	EvidenceFileKey  *string
	AudioFileKey     *string
	Severity         Severity
	Verified         bool
	VerifiedAt       *time.Time
	VerifiedByUserID *string
	CreatedAt        time.Time
	UpdatedAt        time.Time
}

type IncidentStats struct {
	Total         int `json:"total"`
	Reported      int `json:"reported"`
	Investigating int `json:"investigating"`
	Resolved      int `json:"resolved"`
	Closed        int `json:"closed"`
	ThisWeek      int `json:"thisWeek"`
	LastWeek      int `json:"lastWeek"`
}

type WeeklyTrendPoint struct {
	Week  string `json:"week"`
	Count int    `json:"count"`
}

type HeatmapPoint struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Weight    float64 `json:"weight"`
}

type GrowthMetric struct {
	Current    int     `json:"current"`
	Previous   int     `json:"previous"`
	Percentage float64 `json:"percentage"`
}

type PlatformStats struct {
	TotalOrganizations  int     `json:"totalOrganizations"`
	TotalAdmins         int     `json:"totalAdmins"`
	TotalWatchers       int     `json:"totalWatchers"`
	PendingApplications int     `json:"pendingApplications"`
	ReportsThisMonth    int     `json:"reportsThisMonth"`
	ActiveForms         int     `json:"activeForms"`
	CriticalIncidents   int     `json:"criticalIncidents"`
	UptimePercentage    float64 `json:"uptimePercentage"`
	Growth             struct {
		Organizations GrowthMetric `json:"organizations"`
		Admins        GrowthMetric `json:"admins"`
		Watchers      GrowthMetric `json:"watchers"`
	} `json:"growth"`
	Metrics struct {
		NewOrganizationsThisMonth int     `json:"newOrganizationsThisMonth"`
		NewAdminsThisMonth        int     `json:"newAdminsThisMonth"`
		NewWatchersThisMonth      int     `json:"newWatchersThisMonth"`
		AverageReportsPerOrg      float64 `json:"averageReportsPerOrg"`
	} `json:"metrics"`
}

type ActivityItem struct {
	ID          string    `json:"id"`
	Type        string    `json:"type"`
	Description string    `json:"description"`
	Timestamp   time.Time `json:"timestamp"`
	UserName    string    `json:"userName"`
}
