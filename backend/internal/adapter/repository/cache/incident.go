package cache

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"

	"backend/internal/domain/entity"
	"backend/internal/domain/repository"
)

const platformTrendTTL = 1 * time.Hour

const (
	incidentStatsTTL   = 5 * time.Minute
	incidentTrendTTL   = 1 * time.Hour
	incidentPendingTTL = 1 * time.Minute
)

// CachedIncidentRepository caches the analytics queries (stats, trend, pending) that are
// called on every dashboard load. Non-analytics reads and all writes delegate directly.
// On Create, stats and pending caches are invalidated since the org is known.
// On UpdateStatus/Delete the short TTLs handle eventual consistency without needing the orgID.
type CachedIncidentRepository struct {
	rdb  *redis.Client
	repo repository.IncidentRepository
}

func NewCachedIncidentRepository(rdb *redis.Client, repo repository.IncidentRepository) *CachedIncidentRepository {
	return &CachedIncidentRepository{rdb: rdb, repo: repo}
}

func (r *CachedIncidentRepository) FindAll(ctx context.Context, orgID string, params entity.ListParams) ([]*entity.Incident, int, error) {
	return r.repo.FindAll(ctx, orgID, params)
}

func (r *CachedIncidentRepository) FindByID(ctx context.Context, id string) (*entity.Incident, error) {
	return r.repo.FindByID(ctx, id)
}

func (r *CachedIncidentRepository) FindAllForSuperAdmin(ctx context.Context, params entity.ListParams) ([]*entity.Incident, int, error) {
	return r.repo.FindAllForSuperAdmin(ctx, params)
}

func (r *CachedIncidentRepository) Create(ctx context.Context, incident *entity.Incident) error {
	if err := r.repo.Create(ctx, incident); err != nil {
		return err
	}
	r.invalidateOrgAnalytics(context.Background(), incident.OrganizationID)
	return nil
}

func (r *CachedIncidentRepository) UpdateStatus(ctx context.Context, id string, status entity.IncidentStatus) error {
	// orgID is not available here; short TTLs on stats (5m) and pending (1m) handle staleness.
	return r.repo.UpdateStatus(ctx, id, status)
}

func (r *CachedIncidentRepository) Delete(ctx context.Context, id string) error {
	return r.repo.Delete(ctx, id)
}

func (r *CachedIncidentRepository) GetStats(ctx context.Context, orgID string) (*entity.IncidentStats, error) {
	key := fmt.Sprintf("inc:stats:%s", orgID)
	if cached, ok := cacheGet[entity.IncidentStats](ctx, r.rdb, key); ok {
		return &cached, nil
	}
	result, err := r.repo.GetStats(ctx, orgID)
	if err != nil || result == nil {
		return result, err
	}
	cacheSet(ctx, r.rdb, key, result, incidentStatsTTL)
	return result, nil
}

func (r *CachedIncidentRepository) GetWeeklyTrend(ctx context.Context, orgID string) ([]*entity.WeeklyTrendPoint, error) {
	key := fmt.Sprintf("inc:trend:%s", orgID)
	if cached, ok := cacheGet[[]*entity.WeeklyTrendPoint](ctx, r.rdb, key); ok {
		return cached, nil
	}
	result, err := r.repo.GetWeeklyTrend(ctx, orgID)
	if err != nil || result == nil {
		return result, err
	}
	cacheSet(ctx, r.rdb, key, result, incidentTrendTTL)
	return result, nil
}

func (r *CachedIncidentRepository) GetRecent(ctx context.Context, orgID string, limit int) ([]*entity.Incident, error) {
	return r.repo.GetRecent(ctx, orgID, limit)
}

func (r *CachedIncidentRepository) GetPending(ctx context.Context, orgID string) ([]*entity.Incident, error) {
	key := fmt.Sprintf("inc:pending:%s", orgID)
	if cached, ok := cacheGet[[]*entity.Incident](ctx, r.rdb, key); ok {
		return cached, nil
	}
	result, err := r.repo.GetPending(ctx, orgID)
	if err != nil || result == nil {
		return result, err
	}
	cacheSet(ctx, r.rdb, key, result, incidentPendingTTL)
	return result, nil
}

func (r *CachedIncidentRepository) CountAllSince(ctx context.Context, since time.Time) (int, error) {
	return r.repo.CountAllSince(ctx, since)
}

func (r *CachedIncidentRepository) GetPlatformWeeklyTrend(ctx context.Context) ([]*entity.WeeklyTrendPoint, error) {
	const key = "inc:platform:trend"
	if cached, ok := cacheGet[[]*entity.WeeklyTrendPoint](ctx, r.rdb, key); ok {
		return cached, nil
	}
	result, err := r.repo.GetPlatformWeeklyTrend(ctx)
	if err != nil || result == nil {
		return result, err
	}
	cacheSet(ctx, r.rdb, key, result, platformTrendTTL)
	return result, nil
}

func (r *CachedIncidentRepository) invalidateOrgAnalytics(ctx context.Context, orgID string) {
	cacheDel(ctx, r.rdb,
		fmt.Sprintf("inc:stats:%s", orgID),
		fmt.Sprintf("inc:trend:%s", orgID),
		fmt.Sprintf("inc:pending:%s", orgID),
	)
}
