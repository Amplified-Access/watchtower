package cache

import (
	"context"
	"crypto/sha1"
	"encoding/hex"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"

	"backend/internal/domain/entity"
	"backend/internal/domain/repository"
)

const (
	heatmapTTL        = 30 * time.Minute
	keyAnonHeatmap    = "anon:heatmap"

	// Map rows are cached per filter. Rather than hunting down every filter
	// combination when a report comes in, the keys carry a version number
	// that Create bumps, which strands the old entries until their TTL. The
	// TTL is short because relative periods ("24h") drift as time passes.
	mapRowsTTL    = 5 * time.Minute
	keyMapVersion = "anon:map:version"
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

func (r *CachedAnonymousReportRepository) FindAll(ctx context.Context, country, category *string, since *time.Time) ([]*entity.AnonymousIncidentReport, error) {
	return r.repo.FindAll(ctx, country, category, since)
}

func (r *CachedAnonymousReportRepository) FindByID(ctx context.Context, id string) (*entity.AnonymousIncidentReport, error) {
	return r.repo.FindByID(ctx, id)
}

func (r *CachedAnonymousReportRepository) Create(ctx context.Context, report *entity.AnonymousIncidentReport) error {
	if err := r.repo.Create(ctx, report); err != nil {
		return err
	}
	cacheDel(context.Background(), r.rdb, keyAnonHeatmap)
	_ = r.rdb.Incr(context.Background(), keyMapVersion).Err()
	return nil
}

func (r *CachedAnonymousReportRepository) FindForMap(ctx context.Context, filter entity.MapFilter) ([]*entity.MapReportRow, error) {
	key := mapRowsKey(r.rdb.Get(ctx, keyMapVersion).Val(), filter)
	if cached, ok := cacheGet[[]*entity.MapReportRow](ctx, r.rdb, key); ok {
		return cached, nil
	}
	result, err := r.repo.FindForMap(ctx, filter)
	if err != nil {
		return nil, err
	}
	cacheSet(ctx, r.rdb, key, result, mapRowsTTL)
	return result, nil
}

// mapRowsKey hashes a canonical form of the filter, so the same filter always
// lands on the same key whatever order the excluded types arrived in.
func mapRowsKey(version string, f entity.MapFilter) string {
	excluded := append([]string(nil), f.ExcludeTypeIDs...)
	sort.Strings(excluded)
	day := func(t *time.Time) string {
		if t == nil {
			return ""
		}
		return t.UTC().Format(time.DateOnly)
	}
	canonical := fmt.Sprintf("c=%s|x=%s|n=%s|p=%s|f=%s|t=%s|q=%s",
		f.Category, strings.Join(excluded, ","), f.Country, f.Period,
		day(f.From), day(f.To), strings.ToLower(f.Query))
	sum := sha1.Sum([]byte(canonical))
	if version == "" {
		version = "0"
	}
	return "anon:map:v" + version + ":" + hex.EncodeToString(sum[:])
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

func (r *CachedAnonymousReportRepository) GetTypeDistribution(ctx context.Context) ([]*entity.TypeCount, error) {
	const key = "anon:type-dist"
	if cached, ok := cacheGet[[]*entity.TypeCount](ctx, r.rdb, key); ok {
		return cached, nil
	}
	result, err := r.repo.GetTypeDistribution(ctx)
	if err != nil || result == nil {
		return result, err
	}
	cacheSet(ctx, r.rdb, key, result, 30*time.Minute)
	return result, nil
}
