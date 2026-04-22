package entity

import "time"

type InsightStatus string

const (
	InsightDraft     InsightStatus = "draft"
	InsightPublished InsightStatus = "published"
)

type InsightTag struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Slug      string    `json:"slug"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type Insight struct {
	ID             string                 `json:"id"`
	Title          string                 `json:"title"`
	Slug           string                 `json:"slug"`
	Description    string                 `json:"description"`
	Content        map[string]interface{} `json:"content"`
	AuthorID       string                 `json:"authorId"`
	OrganizationID *string                `json:"organizationId,omitempty"`
	ImageURL       *string                `json:"imageUrl,omitempty"`
	ImageAlt       *string                `json:"imageAlt,omitempty"`
	Status         InsightStatus          `json:"status"`
	PublishedAt    *time.Time             `json:"publishedAt,omitempty"`
	Tags           []InsightTag           `json:"tags,omitempty"`
	CreatedAt      time.Time              `json:"createdAt"`
	UpdatedAt      time.Time              `json:"updatedAt"`
}
