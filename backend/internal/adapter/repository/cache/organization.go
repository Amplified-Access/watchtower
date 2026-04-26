package cache

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"

	"backend/internal/domain/entity"
	"backend/internal/domain/repository"
)

const orgTTL = 1 * time.Hour

// CachedOrganizationRepository caches single-org lookups by ID and slug.
// List queries (FindAll) are not cached because they are paginated and parameterized.
type CachedOrganizationRepository struct {
	rdb  *redis.Client
	repo repository.OrganizationRepository
}

func NewCachedOrganizationRepository(rdb *redis.Client, repo repository.OrganizationRepository) *CachedOrganizationRepository {
	return &CachedOrganizationRepository{rdb: rdb, repo: repo}
}

func (r *CachedOrganizationRepository) FindAll(ctx context.Context, params entity.ListParams) ([]*entity.Organization, int, error) {
	return r.repo.FindAll(ctx, params)
}

func (r *CachedOrganizationRepository) FindByID(ctx context.Context, id string) (*entity.Organization, error) {
	key := fmt.Sprintf("org:id:%s", id)
	if cached, ok := cacheGet[entity.Organization](ctx, r.rdb, key); ok {
		return &cached, nil
	}
	result, err := r.repo.FindByID(ctx, id)
	if err != nil || result == nil {
		return result, err
	}
	cacheSet(ctx, r.rdb, key, result, orgTTL)
	return result, nil
}

func (r *CachedOrganizationRepository) FindBySlug(ctx context.Context, slug string) (*entity.Organization, error) {
	key := fmt.Sprintf("org:slug:%s", slug)
	if cached, ok := cacheGet[entity.Organization](ctx, r.rdb, key); ok {
		return &cached, nil
	}
	result, err := r.repo.FindBySlug(ctx, slug)
	if err != nil || result == nil {
		return result, err
	}
	cacheSet(ctx, r.rdb, key, result, orgTTL)
	return result, nil
}

func (r *CachedOrganizationRepository) CountCreatedSince(ctx context.Context, since time.Time) (int, error) {
	return r.repo.CountCreatedSince(ctx, since)
}

func (r *CachedOrganizationRepository) Create(ctx context.Context, org *entity.Organization) error {
	return r.repo.Create(ctx, org)
}

func (r *CachedOrganizationRepository) Update(ctx context.Context, org *entity.Organization) error {
	if err := r.repo.Update(ctx, org); err != nil {
		return err
	}
	cacheDel(ctx, r.rdb,
		fmt.Sprintf("org:id:%s", org.ID),
		fmt.Sprintf("org:slug:%s", org.Slug),
	)
	return nil
}
