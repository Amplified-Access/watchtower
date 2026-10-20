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
	CreatedAt        time.Time        `json:"createdAt"`
	UpdatedAt        time.Time        `json:"updatedAt"`
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
