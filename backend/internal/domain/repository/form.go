package repository

import (
	"context"

	"backend/internal/domain/entity"
)

type FormRepository interface {
	FindByOrganizationID(ctx context.Context, orgID string) ([]*entity.Form, error)
	FindActiveByOrganizationID(ctx context.Context, orgID string) ([]*entity.Form, error)
	FindByID(ctx context.Context, id string) (*entity.Form, error)
	FindAllForSuperAdmin(ctx context.Context, params entity.ListParams) ([]*entity.Form, int, error)
	Create(ctx context.Context, form *entity.Form) error
	Update(ctx context.Context, form *entity.Form) error
	Delete(ctx context.Context, id string) error
}
