package entity

import "time"

type InsightStatus string

const (
	InsightDraft     InsightStatus = "draft"
	InsightPublished InsightStatus = "published"
)

type InsightTag struct {
	ID        string
	Title     string
	Slug      string
	CreatedAt time.Time
	UpdatedAt time.Time
}

type Insight struct {
	ID             string
	Title          string
	Slug           string
	Description    string
	Content        map[string]interface{}
	AuthorID       string
	OrganizationID *string
	ImageURL       *string
	ImageAlt       *string
	Status         InsightStatus
	PublishedAt    *time.Time
	Tags           []InsightTag
	CreatedAt      time.Time
	UpdatedAt      time.Time
}
