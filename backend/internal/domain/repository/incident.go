package repository

import (
	"context"
	"time"

	"backend/internal/domain/entity"
)

type IncidentTypeRepository interface {
	FindAll(ctx context.Context, activeOnly bool) ([]*entity.IncidentType, error)
	FindByID(ctx context.Context, id string) (*entity.IncidentType, error)
	FindByOrganizationID(ctx context.Context, orgID string) ([]*entity.IncidentType, error)
	FindAvailableForOrganization(ctx context.Context, orgID string) ([]*entity.IncidentType, error)
	Create(ctx context.Context, t *entity.IncidentType) error
	EnableForOrganization(ctx context.Context, orgID, typeID string) error
	DisableForOrganization(ctx context.Context, orgID, typeID string) error
}

type IncidentRepository interface {
	FindAll(ctx context.Context, orgID string, params entity.ListParams) ([]*entity.Incident, int, error)
	FindByID(ctx context.Context, id string) (*entity.Incident, error)
	FindAllForSuperAdmin(ctx context.Context, params entity.ListParams) ([]*entity.Incident, int, error)
	Create(ctx context.Context, incident *entity.Incident) error
	UpdateStatus(ctx context.Context, id string, status entity.IncidentStatus) error
	Delete(ctx context.Context, id string) error
	GetStats(ctx context.Context, orgID string) (*entity.IncidentStats, error)
	GetWeeklyTrend(ctx context.Context, orgID string) ([]*entity.WeeklyTrendPoint, error)
	GetRecent(ctx context.Context, orgID string, limit int) ([]*entity.Incident, error)
	GetPending(ctx context.Context, orgID string) ([]*entity.Incident, error)
	CountAllSince(ctx context.Context, since time.Time) (int, error)
	GetPlatformWeeklyTrend(ctx context.Context) ([]*entity.WeeklyTrendPoint, error)
}

type AnonymousIncidentReportRepository interface {
	FindAll(ctx context.Context, country, category *string) ([]*entity.AnonymousIncidentReport, error)
	FindByID(ctx context.Context, id string) (*entity.AnonymousIncidentReport, error)
	Create(ctx context.Context, report *entity.AnonymousIncidentReport) error
	GetHeatmapData(ctx context.Context) ([]*entity.HeatmapPoint, error)
	GetTypeDistribution(ctx context.Context) ([]*entity.TypeCount, error)
}

type OrganizationIncidentReportRepository interface {
	FindByOrganizationID(ctx context.Context, orgID string, params entity.ListParams) ([]*entity.OrganizationIncidentReport, int, error)
	FindByUserID(ctx context.Context, userID, orgID string, params entity.ListParams) ([]*entity.OrganizationIncidentReport, int, error)
	FindByID(ctx context.Context, id string) (*entity.OrganizationIncidentReport, error)
	Create(ctx context.Context, report *entity.OrganizationIncidentReport) error
	GetStats(ctx context.Context, orgID string) (*entity.IncidentStats, error)
	CountCritical(ctx context.Context) (int, error)
}
