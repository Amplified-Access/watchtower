package entity

import "time"

type Form struct {
	ID             string                 `json:"id"`
	OrganizationID string                 `json:"organizationId"`
	Name           string                 `json:"name"`
	Definition     map[string]interface{} `json:"definition"`
	IsActive       bool                   `json:"isActive"`
	CreatedAt      time.Time              `json:"createdAt"`
	UpdatedAt      time.Time              `json:"updatedAt"`
}
