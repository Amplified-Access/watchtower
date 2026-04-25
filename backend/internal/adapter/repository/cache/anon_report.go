package cache

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"

	"backend/internal/domain/entity"
	"backend/internal/domain/repository"
)

const (
	heatmapTTL        = 30 * time.Minute
	keyAnonHeatmap    = "anon:heatmap"
)

// CachedAnonymousReportRepository caches the heatmap aggregation query, which is an
// expensive JSON-extraction aggregation run on every public map view.
type CachedAnonymousReportRepository struct {
	rdb  *redis.Client
	repo repository.AnonymousIncidentReportRepository
}

func NewCachedAnonymousReportRepository(rdb *redis.Client, repo repository.AnonymousIncidentReportRepository) *CachedAnonymousReportRepository {
	return &CachedAnonymousReportRepository{rdb: rdb, repo: repo}
}

func (r *CachedAnonymousReportRepository) FindAll(ctx context.Context, country, category *string) ([]*entity.AnonymousIncidentReport, error) {
	return r.repo.FindAll(ctx, country, category)
}

func (r *CachedAnonymousReportRepository) FindByID(ctx context.Context, id string) (*entity.AnonymousIncidentReport, error) {
	return r.repo.FindByID(ctx, id)
}

func (r *CachedAnonymousReportRepository) Create(ctx context.Context, report *entity.AnonymousIncidentReport) error {
	if err := r.repo.Create(ctx, report); err != nil {
		return err
	}
	cacheDel(context.Background(), r.rdb, keyAnonHeatmap)
	return nil
}

func (r *CachedAnonymousReportRepository) GetHeatmapData(ctx context.Context) ([]*entity.HeatmapPoint, error) {
	if cached, ok := cacheGet[[]*entity.HeatmapPoint](ctx, r.rdb, keyAnonHeatmap); ok {
		return cached, nil
	}
	result, err := r.repo.GetHeatmapData(ctx)
	if err != nil || result == nil {
		return result, err
	}
	cacheSet(ctx, r.rdb, keyAnonHeatmap, result, heatmapTTL)
	return result, nil
}
