package cache

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"

	"backend/internal/domain/entity"
	"backend/internal/domain/repository"
)

const (
	datasetCategoriesTTL = 24 * time.Hour
	keyDatasetCategories = "dataset:categories"
)

// CachedDatasetRepository caches the distinct-categories query, which is near-static
// and loaded on every public dataset listing page.
type CachedDatasetRepository struct {
	rdb  *redis.Client
	repo repository.DatasetRepository
}

func NewCachedDatasetRepository(rdb *redis.Client, repo repository.DatasetRepository) *CachedDatasetRepository {
	return &CachedDatasetRepository{rdb: rdb, repo: repo}
}

func (r *CachedDatasetRepository) FindPublic(ctx context.Context, params entity.ListParams, category *string) ([]*entity.Dataset, int, error) {
	return r.repo.FindPublic(ctx, params, category)
}

func (r *CachedDatasetRepository) FindByID(ctx context.Context, id string) (*entity.Dataset, error) {
	return r.repo.FindByID(ctx, id)
}

func (r *CachedDatasetRepository) FindAll(ctx context.Context, params entity.ListParams) ([]*entity.Dataset, int, error) {
	return r.repo.FindAll(ctx, params)
}

func (r *CachedDatasetRepository) FindCategories(ctx context.Context) ([]string, error) {
	if cached, ok := cacheGet[[]string](ctx, r.rdb, keyDatasetCategories); ok {
		return cached, nil
	}
	result, err := r.repo.FindCategories(ctx)
	if err != nil || result == nil {
		return result, err
	}
	cacheSet(ctx, r.rdb, keyDatasetCategories, result, datasetCategoriesTTL)
	return result, nil
}

func (r *CachedDatasetRepository) Create(ctx context.Context, d *entity.Dataset) error {
	if err := r.repo.Create(ctx, d); err != nil {
		return err
	}
	cacheDel(context.Background(), r.rdb, keyDatasetCategories)
	return nil
}

func (r *CachedDatasetRepository) Update(ctx context.Context, d *entity.Dataset) error {
	if err := r.repo.Update(ctx, d); err != nil {
		return err
	}
	cacheDel(context.Background(), r.rdb, keyDatasetCategories)
	return nil
}

func (r *CachedDatasetRepository) Delete(ctx context.Context, id string) error {
	if err := r.repo.Delete(ctx, id); err != nil {
		return err
	}
	cacheDel(context.Background(), r.rdb, keyDatasetCategories)
	return nil
}

func (r *CachedDatasetRepository) IncrementDownload(ctx context.Context, id string) error {
	return r.repo.IncrementDownload(ctx, id)
}
