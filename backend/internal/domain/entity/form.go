package entity

import "time"

type Form struct {
	ID             string
	OrganizationID string
	Name           string
	Definition     map[string]interface{}
	IsActive       bool
	CreatedAt      time.Time
	UpdatedAt      time.Time
}
