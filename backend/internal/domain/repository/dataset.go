package repository

import (
	"context"

	"backend/internal/domain/entity"
)

type DatasetRepository interface {
	FindPublic(ctx context.Context, params entity.ListParams, category *string) ([]*entity.Dataset, int, error)
	FindByID(ctx context.Context, id string) (*entity.Dataset, error)
	FindAll(ctx context.Context, params entity.ListParams) ([]*entity.Dataset, int, error)
	FindCategories(ctx context.Context) ([]string, error)
	Create(ctx context.Context, dataset *entity.Dataset) error
	Update(ctx context.Context, dataset *entity.Dataset) error
	Delete(ctx context.Context, id string) error
	IncrementDownload(ctx context.Context, id string) error
}
