package entity

import "time"

type ApplicationStatus string

const (
	ApplicationPending  ApplicationStatus = "pending"
	ApplicationApproved ApplicationStatus = "approved"
	ApplicationDeclined ApplicationStatus = "declined"
)

type Organization struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Slug         string    `json:"slug"`
	Description  *string   `json:"description,omitempty"`
	Website      *string   `json:"website,omitempty"`
	Location     *string   `json:"location,omitempty"`
	ContactEmail *string   `json:"contactEmail,omitempty"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type OrganizationApplication struct {
	ID                         int               `json:"id"`
	OrganizationName           string            `json:"organizationName"`
	ApplicantName              string            `json:"applicantName"`
	ApplicantEmail             string            `json:"applicantEmail"`
	Website                    *string           `json:"website,omitempty"`
	CertificateOfIncorporation *string           `json:"certificateOfIncorporation,omitempty"`
	Status                     ApplicationStatus `json:"status"`
	CreatedAt                  time.Time         `json:"createdAt"`
	UpdatedAt                  time.Time         `json:"updatedAt"`
}
