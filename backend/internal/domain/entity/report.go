package entity

import "time"

type ReportStatus string

const (
	ReportDraft     ReportStatus = "draft"
	ReportPublished ReportStatus = "published"
)

type Report struct {
	ID               string
	OrganizationID   string
	ReportedByUserID string
	Title            string
	FileKey          string
	Status           ReportStatus
	CreatedAt        time.Time
	UpdatedAt        time.Time
}
