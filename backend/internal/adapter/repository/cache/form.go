package cache

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"

	"backend/internal/domain/entity"
	"backend/internal/domain/repository"
)

const formActiveTTL = 5 * time.Minute

// CachedFormRepository caches the active-forms-per-org query that runs on every watcher
// incident submission. Write operations invalidate the relevant org's active form cache.
type CachedFormRepository struct {
	rdb  *redis.Client
	repo repository.FormRepository
}

func NewCachedFormRepository(rdb *redis.Client, repo repository.FormRepository) *CachedFormRepository {
	return &CachedFormRepository{rdb: rdb, repo: repo}
}

func (r *CachedFormRepository) FindByOrganizationID(ctx context.Context, orgID string) ([]*entity.Form, error) {
	return r.repo.FindByOrganizationID(ctx, orgID)
}

func (r *CachedFormRepository) FindActiveByOrganizationID(ctx context.Context, orgID string) ([]*entity.Form, error) {
	key := fmt.Sprintf("form:active:%s", orgID)
	if cached, ok := cacheGet[[]*entity.Form](ctx, r.rdb, key); ok {
		return cached, nil
	}
	result, err := r.repo.FindActiveByOrganizationID(ctx, orgID)
	if err != nil || result == nil {
		return result, err
	}
	cacheSet(ctx, r.rdb, key, result, formActiveTTL)
	return result, nil
}

func (r *CachedFormRepository) FindByID(ctx context.Context, id string) (*entity.Form, error) {
	return r.repo.FindByID(ctx, id)
}

func (r *CachedFormRepository) FindAllForSuperAdmin(ctx context.Context, params entity.ListParams) ([]*entity.Form, int, error) {
	return r.repo.FindAllForSuperAdmin(ctx, params)
}

func (r *CachedFormRepository) Create(ctx context.Context, form *entity.Form) error {
	if err := r.repo.Create(ctx, form); err != nil {
		return err
	}
	cacheDel(ctx, r.rdb, fmt.Sprintf("form:active:%s", form.OrganizationID))
	return nil
}

func (r *CachedFormRepository) Update(ctx context.Context, form *entity.Form) error {
	if err := r.repo.Update(ctx, form); err != nil {
		return err
	}
	cacheDel(ctx, r.rdb, fmt.Sprintf("form:active:%s", form.OrganizationID))
	return nil
}

func (r *CachedFormRepository) Delete(ctx context.Context, id string) error {
	// orgID is not available here; the 5-minute TTL handles eventual consistency.
	return r.repo.Delete(ctx, id)
}
