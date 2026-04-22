package entity

import "time"

type UserRole string

const (
	RoleSuperAdmin          UserRole = "super-admin"
	RoleAdmin               UserRole = "admin"
	RoleWatcher             UserRole = "watcher"
	RoleIndependentReporter UserRole = "independent-reporter"
)

type User struct {
	ID             string     `json:"id"`
	Name           string     `json:"name"`
	Email          string     `json:"email"`
	EmailVerified  bool       `json:"emailVerified"`
	Image          *string    `json:"image,omitempty"`
	Role           UserRole   `json:"role"`
	OrganizationID *string    `json:"organizationId,omitempty"`
	Banned         bool       `json:"banned"`
	BanReason      *string    `json:"banReason,omitempty"`
	BanExpires     *time.Time `json:"banExpires,omitempty"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`
}

type Session struct {
	ID             string     `json:"id"`
	ExpiresAt      time.Time  `json:"expiresAt"`
	Token          string     `json:"token"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`
	IPAddress      *string    `json:"ipAddress,omitempty"`
	UserAgent      *string    `json:"userAgent,omitempty"`
	UserID         string     `json:"userId"`
	ImpersonatedBy *string    `json:"impersonatedBy,omitempty"`
}
