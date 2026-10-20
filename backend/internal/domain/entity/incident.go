package entity

import (
	"math"
	"time"
)

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
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Address   *string `json:"address,omitempty"`
	Country   *string `json:"country,omitempty"`
	Name      *string `json:"name,omitempty"`
}

type IncidentType struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description *string   `json:"description,omitempty"`
	Color       string    `json:"color"`
	IsActive    bool      `json:"isActive"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type OrganizationIncidentType struct {
	ID             string        `json:"id"`
	OrganizationID string        `json:"organizationId"`
	IncidentTypeID string        `json:"incidentTypeId"`
	IsEnabled      bool          `json:"isEnabled"`
	IncidentType   *IncidentType `json:"incidentType,omitempty"`
	CreatedAt      time.Time     `json:"createdAt"`
	UpdatedAt      time.Time     `json:"updatedAt"`
}

type Incident struct {
	ID               string                 `json:"id"`
	OrganizationID   string                 `json:"organizationId"`
	FormID           string                 `json:"formId"`
	ReportedByUserID string                 `json:"reportedByUserId"`
	Data             map[string]interface{} `json:"data"`
	Status           IncidentStatus         `json:"status"`
	CreatedAt        time.Time              `json:"createdAt"`
	UpdatedAt        time.Time              `json:"updatedAt"`
	OrganizationName *string               `json:"organizationName,omitempty"`
	FormName         *string               `json:"formName,omitempty"`
	ReporterEmail    *string               `json:"reporterEmail,omitempty"`
}

type AnonymousIncidentReport struct {
	ID              string        `json:"id"`
	// The deployment whose reporting link the report came through, if any.
	DeploymentID    *string       `json:"deploymentId,omitempty"`
	IncidentTypeID  string        `json:"incidentTypeId"`
	IncidentType    *IncidentType `json:"incidentType,omitempty"`
	Location        Location      `json:"location"`
	Description     string        `json:"description"`
	Entities        []string      `json:"entities,omitempty"`
	Injuries        int           `json:"injuries"`
	Fatalities      int           `json:"fatalities"`
	EvidenceFileKey *string       `json:"evidenceFileKey,omitempty"`
	AudioFileKey    *string       `json:"audioFileKey,omitempty"`
	CreatedAt       time.Time     `json:"createdAt"`
	UpdatedAt       time.Time     `json:"updatedAt"`
}

type OrganizationIncidentReport struct {
	ID               string        `json:"id"`
	OrganizationID   string        `json:"organizationId"`
	ReportedByUserID string        `json:"reportedByUserId"`
	IncidentTypeID   string        `json:"incidentTypeId"`
	IncidentType     *IncidentType `json:"incidentType,omitempty"`
	Location         Location      `json:"location"`
	Description      string        `json:"description"`
	Entities         []string      `json:"entities,omitempty"`
	Injuries         int           `json:"injuries"`
	Fatalities       int           `json:"fatalities"`
	EvidenceFileKey  *string       `json:"evidenceFileKey,omitempty"`
	AudioFileKey     *string       `json:"audioFileKey,omitempty"`
	Severity         Severity      `json:"severity"`
	Verified         bool          `json:"verified"`
	VerifiedAt       *time.Time    `json:"verifiedAt,omitempty"`
	VerifiedByUserID *string       `json:"verifiedByUserId,omitempty"`
	CreatedAt        time.Time     `json:"createdAt"`
	UpdatedAt        time.Time     `json:"updatedAt"`
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

type TypeCount struct {
	Name  string `json:"name"`
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

// NewGrowthMetric compares a period's count with the one before, as a
// percentage to one decimal place (100 when the earlier one was zero).
func NewGrowthMetric(current, previous int) GrowthMetric {
	var pct float64
	if previous > 0 {
		pct = math.Round(float64(current-previous)/float64(previous)*100*10) / 10
	} else if current > 0 {
		pct = 100
	}
	return GrowthMetric{Current: current, Previous: previous, Percentage: pct}
}

// PlatformStats is the super admin's dashboard: what the platform holds
// now, on the deployments model.
type PlatformStats struct {
	TotalOrganizations  int              `json:"totalOrganizations"`
	PendingApplications int              `json:"pendingApplications"`
	Deployments         DeploymentCounts `json:"deployments"`
	// Public reports this month against last month.
	Reports GrowthMetric `json:"reports"`
	Growth  struct {
		// New organizations this month against last month.
		Organizations GrowthMetric `json:"organizations"`
	} `json:"growth"`
	// The deployments that gathered the most reports this month.
	MostActiveDeployments []*DeploymentActivity `json:"mostActiveDeployments"`
}
