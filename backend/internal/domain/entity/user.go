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
	ID             string
	Name           string
	Email          string
	EmailVerified  bool
	Image          *string
	Role           UserRole
	OrganizationID *string
	Banned         bool
	BanReason      *string
	BanExpires     *time.Time
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

type Session struct {
	ID             string
	ExpiresAt      time.Time
	Token          string
	CreatedAt      time.Time
	UpdatedAt      time.Time
	IPAddress      *string
	UserAgent      *string
	UserID         string
	ImpersonatedBy *string
}
