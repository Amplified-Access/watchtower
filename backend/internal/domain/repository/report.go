package repository

import (
	"context"

	"backend/internal/domain/entity"
)

type ReportRepository interface {
	FindPublic(ctx context.Context, params entity.ListParams) ([]*entity.Report, int, error)
	FindPublicByID(ctx context.Context, id string) (*entity.Report, error)
	FindByOrganizationID(ctx context.Context, orgID string, status *entity.ReportStatus) ([]*entity.Report, error)
	FindByID(ctx context.Context, id string) (*entity.Report, error)
	FindAllForSuperAdmin(ctx context.Context, params entity.ListParams) ([]*entity.Report, int, error)
	Create(ctx context.Context, report *entity.Report) error
	Update(ctx context.Context, report *entity.Report) error
	Delete(ctx context.Context, id string) error
}
