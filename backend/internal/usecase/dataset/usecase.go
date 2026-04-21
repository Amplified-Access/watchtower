package datasetusecase

import (
	"context"

	"backend/internal/domain/entity"
	domainerrors "backend/internal/domain/errors"
	"backend/internal/domain/repository"
)

type UseCase struct {
	repo repository.DatasetRepository
}

func New(repo repository.DatasetRepository) *UseCase {
	return &UseCase{repo: repo}
}

func (uc *UseCase) GetPublicDatasets(ctx context.Context, params entity.ListParams, category *string) ([]*entity.Dataset, int, error) {
	return uc.repo.FindPublic(ctx, params, category)
}

func (uc *UseCase) GetDatasetByID(ctx context.Context, id string) (*entity.Dataset, error) {
	d, err := uc.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if d == nil {
		return nil, domainerrors.NewNotFound("dataset not found")
	}
	return d, nil
}

func (uc *UseCase) GetCategories(ctx context.Context) ([]string, error) {
	return uc.repo.FindCategories(ctx)
}

func (uc *UseCase) IncrementDownload(ctx context.Context, id string) error {
	return uc.repo.IncrementDownload(ctx, id)
}

func (uc *UseCase) GetAllDatasets(ctx context.Context, params entity.ListParams) ([]*entity.Dataset, int, error) {
	return uc.repo.FindAll(ctx, params)
}

func (uc *UseCase) CreateDataset(ctx context.Context, dataset *entity.Dataset) error {
	return uc.repo.Create(ctx, dataset)
}

func (uc *UseCase) UpdateDataset(ctx context.Context, dataset *entity.Dataset) error {
	return uc.repo.Update(ctx, dataset)
}

func (uc *UseCase) DeleteDataset(ctx context.Context, id string) error {
	return uc.repo.Delete(ctx, id)
}
