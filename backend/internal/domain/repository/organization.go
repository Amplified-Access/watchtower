package repository

import (
	"context"

	"backend/internal/domain/entity"
)

type OrganizationRepository interface {
	FindAll(ctx context.Context, params entity.ListParams) ([]*entity.Organization, int, error)
	FindByID(ctx context.Context, id string) (*entity.Organization, error)
	FindBySlug(ctx context.Context, slug string) (*entity.Organization, error)
	Create(ctx context.Context, org *entity.Organization) error
	Update(ctx context.Context, org *entity.Organization) error
}

type OrganizationApplicationRepository interface {
	FindAll(ctx context.Context) ([]*entity.OrganizationApplication, error)
	FindByID(ctx context.Context, id int) (*entity.OrganizationApplication, error)
	Create(ctx context.Context, app *entity.OrganizationApplication) error
	UpdateStatus(ctx context.Context, id int, status entity.ApplicationStatus) error
}
