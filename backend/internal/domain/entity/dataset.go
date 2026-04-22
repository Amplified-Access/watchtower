package entity

import "time"

type Dataset struct {
	ID            string     `json:"id"`
	Title         string     `json:"title"`
	Description   string     `json:"description"`
	Category      string     `json:"category"`
	Tags          []string   `json:"tags,omitempty"`
	FileKey       string     `json:"fileKey"`
	FileName      string     `json:"fileName"`
	FileSize      int        `json:"fileSize"`
	FileType      string     `json:"fileType"`
	DownloadCount int        `json:"downloadCount"`
	IsPublic      bool       `json:"isPublic"`
	PublishedAt   *time.Time `json:"publishedAt,omitempty"`
	Source        *string    `json:"source,omitempty"`
	License       string     `json:"license"`
	Version       string     `json:"version"`
	Coverage      *string    `json:"coverage,omitempty"`
	Format        string     `json:"format"`
	Keywords      []string   `json:"keywords,omitempty"`
	Methodology   *string    `json:"methodology,omitempty"`
	CreatedAt     time.Time  `json:"createdAt"`
	UpdatedAt     time.Time  `json:"updatedAt"`
}
