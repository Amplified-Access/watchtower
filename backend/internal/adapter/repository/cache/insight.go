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
	insightTagsTTL  = 24 * time.Hour
	insightSlugTTL  = 1 * time.Hour
	keyInsightTags  = "insight:tags"
)

// CachedInsightRepository caches the tags list (near-static, loaded on every insight page)
// and individual insights by slug (public content, stable after publishing).
type CachedInsightRepository struct {
	rdb  *redis.Client
	repo repository.InsightRepository
}

func NewCachedInsightRepository(rdb *redis.Client, repo repository.InsightRepository) *CachedInsightRepository {
	return &CachedInsightRepository{rdb: rdb, repo: repo}
}

func (r *CachedInsightRepository) FindPublic(ctx context.Context, params entity.ListParams, tags []string) ([]*entity.Insight, int, error) {
	return r.repo.FindPublic(ctx, params, tags)
}

func (r *CachedInsightRepository) FindPublicBySlug(ctx context.Context, slug string) (*entity.Insight, error) {
	key := fmt.Sprintf("insight:slug:%s", slug)
	if cached, ok := cacheGet[entity.Insight](ctx, r.rdb, key); ok {
		return &cached, nil
	}
	result, err := r.repo.FindPublicBySlug(ctx, slug)
	if err != nil || result == nil {
		return result, err
	}
	cacheSet(ctx, r.rdb, key, result, insightSlugTTL)
	return result, nil
}

func (r *CachedInsightRepository) FindAllTags(ctx context.Context) ([]*entity.InsightTag, error) {
	if cached, ok := cacheGet[[]*entity.InsightTag](ctx, r.rdb, keyInsightTags); ok {
		return cached, nil
	}
	result, err := r.repo.FindAllTags(ctx)
	if err != nil || result == nil {
		return result, err
	}
	cacheSet(ctx, r.rdb, keyInsightTags, result, insightTagsTTL)
	return result, nil
}

func (r *CachedInsightRepository) Create(ctx context.Context, insight *entity.Insight) error {
	if err := r.repo.Create(ctx, insight); err != nil {
		return err
	}
	cacheDel(context.Background(), r.rdb, keyInsightTags)
	return nil
}
