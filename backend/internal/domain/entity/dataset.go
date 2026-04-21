package entity

import "time"

type Dataset struct {
	ID            string
	Title         string
	Description   string
	Category      string
	Tags          []string
	FileKey       string
	FileName      string
	FileSize      int
	FileType      string
	DownloadCount int
	IsPublic      bool
	PublishedAt   *time.Time
	Source        *string
	License       string
	Version       string
	Coverage      *string
	Format        string
	Keywords      []string
	Methodology   *string
	CreatedAt     time.Time
	UpdatedAt     time.Time
}
