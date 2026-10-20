package entity

import "time"

// DeploymentStatus is where a deployment is in its life: a draft is being
// set up, a live one takes reports, a closed one has finished.
type DeploymentStatus string

const (
	DeploymentDraft  DeploymentStatus = "draft"
	DeploymentLive   DeploymentStatus = "live"
	DeploymentClosed DeploymentStatus = "closed"
)

func (s DeploymentStatus) Valid() bool {
	return s == DeploymentDraft || s == DeploymentLive || s == DeploymentClosed
}

// Deployment is an organization's own map: the reports gathered through its
// reporting link, on a theme (the incident types it tracks) and in an area.
// An organization can run several.
type Deployment struct {
	ID             string `json:"id"`
	OrganizationID string `json:"organizationId"`
	// Read with the deployment, for lists that span organizations.
	OrganizationName string           `json:"organizationName,omitempty"`
	Name             string           `json:"name"`
	Slug             string           `json:"slug"`
	Description      *string          `json:"description,omitempty"`
	Country          *string          `json:"country,omitempty"`
	Region           *string          `json:"region,omitempty"`
	Status           DeploymentStatus `json:"status"`
	StartsAt         *time.Time       `json:"startsAt,omitempty"`
	EndsAt           *time.Time       `json:"endsAt,omitempty"`
	IncidentTypes    []IncidentType   `json:"incidentTypes"`
	// AcceptingReports is AcceptsReports at the time of the request, so
	// pages can offer the reporting link without repeating the rule.
	AcceptingReports bool `json:"acceptingReports"`
	CreatedAt        time.Time        `json:"createdAt"`
	UpdatedAt        time.Time        `json:"updatedAt"`
}

// AcceptsReports says whether the deployment's reporting link takes
// reports at a given time: it is live, and inside its dates if it has them.
func (d *Deployment) AcceptsReports(now time.Time) bool {
	if d.Status != DeploymentLive {
		return false
	}
	if d.StartsAt != nil && now.Before(*d.StartsAt) {
		return false
	}
	// An end date is the deployment's last day: it takes reports through it.
	if d.EndsAt != nil && !now.Before(d.EndsAt.AddDate(0, 0, 1)) {
		return false
	}
	return true
}

// DeploymentCounts is how many deployments there are, by status.
type DeploymentCounts struct {
	Total  int `json:"total"`
	Draft  int `json:"draft"`
	Live   int `json:"live"`
	Closed int `json:"closed"`
}

// NewDeployment is what an admin submits to create a deployment.
type NewDeployment struct {
	Name            string           `json:"name"`
	Description     *string          `json:"description"`
	Country         *string          `json:"country"`
	Region          *string          `json:"region"`
	Status          DeploymentStatus `json:"status"`
	StartsAt        *time.Time       `json:"startsAt"`
	EndsAt          *time.Time       `json:"endsAt"`
	IncidentTypeIDs []string         `json:"incidentTypeIds"`
}
