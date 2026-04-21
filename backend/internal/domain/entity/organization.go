package entity

import "time"

type ApplicationStatus string

const (
	ApplicationPending  ApplicationStatus = "pending"
	ApplicationApproved ApplicationStatus = "approved"
	ApplicationDeclined ApplicationStatus = "declined"
)

type Organization struct {
	ID           string
	Name         string
	Slug         string
	Description  *string
	Website      *string
	Location     *string
	ContactEmail *string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

type OrganizationApplication struct {
	ID                        int
	OrganizationName          string
	ApplicantName             string
	ApplicantEmail            string
	Website                   *string
	CertificateOfIncorporation *string
	Status                    ApplicationStatus
	CreatedAt                 time.Time
	UpdatedAt                 time.Time
}
