package entity

import "time"

type ReportStatus string

const (
	ReportDraft     ReportStatus = "draft"
	ReportPublished ReportStatus = "published"
)

type Report struct {
	ID               string       `json:"id"`
	OrganizationID   string       `json:"organizationId"`
	ReportedByUserID string       `json:"reportedByUserId"`
	Title            string       `json:"title"`
	FileKey          string       `json:"fileKey"`
	Status           ReportStatus `json:"status"`
	CreatedAt        time.Time    `json:"createdAt"`
	UpdatedAt        time.Time    `json:"updatedAt"`
}
