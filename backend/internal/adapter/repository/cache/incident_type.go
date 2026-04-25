package cache

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"

	"backend/internal/domain/entity"
	"backend/internal/domain/repository"
)

const (
	incidentTypeAllTTL = 1 * time.Hour
	incidentTypeOrgTTL = 30 * time.Minute
)

const (
	keyIncidentTypeAll       = "inctype:all"
	keyIncidentTypeAllActive = "inctype:all:active"
)

// CachedIncidentTypeRepository caches global and per-org incident type queries.
// These are configuration-level data that changes infrequently.
type CachedIncidentTypeRepository struct {
	rdb  *redis.Client
	repo repository.IncidentTypeRepository
}

func NewCachedIncidentTypeRepository(rdb *redis.Client, repo repository.IncidentTypeRepository) *CachedIncidentTypeRepository {
	return &CachedIncidentTypeRepository{rdb: rdb, repo: repo}
}

func (r *CachedIncidentTypeRepository) FindAll(ctx context.Context, activeOnly bool) ([]*entity.IncidentType, error) {
	key := keyIncidentTypeAll
	if activeOnly {
		key = keyIncidentTypeAllActive
	}
	if cached, ok := cacheGet[[]*entity.IncidentType](ctx, r.rdb, key); ok {
		return cached, nil
	}
	result, err := r.repo.FindAll(ctx, activeOnly)
	if err != nil || result == nil {
		return result, err
	}
	cacheSet(ctx, r.rdb, key, result, incidentTypeAllTTL)
	return result, nil
}

func (r *CachedIncidentTypeRepository) FindByID(ctx context.Context, id string) (*entity.IncidentType, error) {
	return r.repo.FindByID(ctx, id)
}

func (r *CachedIncidentTypeRepository) FindByOrganizationID(ctx context.Context, orgID string) ([]*entity.IncidentType, error) {
	key := fmt.Sprintf("inctype:org:%s", orgID)
	if cached, ok := cacheGet[[]*entity.IncidentType](ctx, r.rdb, key); ok {
		return cached, nil
	}
	result, err := r.repo.FindByOrganizationID(ctx, orgID)
	if err != nil || result == nil {
		return result, err
	}
	cacheSet(ctx, r.rdb, key, result, incidentTypeOrgTTL)
	return result, nil
}

func (r *CachedIncidentTypeRepository) FindAvailableForOrganization(ctx context.Context, orgID string) ([]*entity.IncidentType, error) {
	key := fmt.Sprintf("inctype:available:%s", orgID)
	if cached, ok := cacheGet[[]*entity.IncidentType](ctx, r.rdb, key); ok {
		return cached, nil
	}
	result, err := r.repo.FindAvailableForOrganization(ctx, orgID)
	if err != nil || result == nil {
		return result, err
	}
	cacheSet(ctx, r.rdb, key, result, incidentTypeOrgTTL)
	return result, nil
}

func (r *CachedIncidentTypeRepository) Create(ctx context.Context, t *entity.IncidentType) error {
	if err := r.repo.Create(ctx, t); err != nil {
		return err
	}
	cacheDel(ctx, r.rdb, keyIncidentTypeAll, keyIncidentTypeAllActive)
	return nil
}

func (r *CachedIncidentTypeRepository) EnableForOrganization(ctx context.Context, orgID, typeID string) error {
	if err := r.repo.EnableForOrganization(ctx, orgID, typeID); err != nil {
		return err
	}
	cacheDel(ctx, r.rdb,
		fmt.Sprintf("inctype:org:%s", orgID),
		fmt.Sprintf("inctype:available:%s", orgID),
	)
	return nil
}

func (r *CachedIncidentTypeRepository) DisableForOrganization(ctx context.Context, orgID, typeID string) error {
	if err := r.repo.DisableForOrganization(ctx, orgID, typeID); err != nil {
		return err
	}
	cacheDel(ctx, r.rdb,
		fmt.Sprintf("inctype:org:%s", orgID),
		fmt.Sprintf("inctype:available:%s", orgID),
	)
	return nil
}
