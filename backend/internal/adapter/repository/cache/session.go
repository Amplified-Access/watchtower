package cache

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"

	"backend/internal/domain/entity"
	"backend/internal/domain/repository"
)

const sessionTTL = 30 * time.Minute

// CachedSessionRepository caches the session→user lookup that runs on every authenticated request.
type CachedSessionRepository struct {
	rdb  *redis.Client
	repo repository.SessionRepository
}

func NewCachedSessionRepository(rdb *redis.Client, repo repository.SessionRepository) *CachedSessionRepository {
	return &CachedSessionRepository{rdb: rdb, repo: repo}
}

func (r *CachedSessionRepository) FindByToken(ctx context.Context, token string) (*entity.Session, error) {
	key := fmt.Sprintf("session:token:%s", token)
	if cached, ok := cacheGet[entity.Session](ctx, r.rdb, key); ok {
		return &cached, nil
	}
	result, err := r.repo.FindByToken(ctx, token)
	if err != nil || result == nil {
		return result, err
	}
	cacheSet(ctx, r.rdb, key, result, sessionTTL)
	return result, nil
}

func (r *CachedSessionRepository) FindUserByToken(ctx context.Context, token string) (*entity.User, error) {
	key := fmt.Sprintf("session:user:%s", token)
	if cached, ok := cacheGet[entity.User](ctx, r.rdb, key); ok {
		return &cached, nil
	}
	result, err := r.repo.FindUserByToken(ctx, token)
	if err != nil || result == nil {
		return result, err
	}
	cacheSet(ctx, r.rdb, key, result, sessionTTL)
	return result, nil
}

// InvalidateToken removes all cached data for a session token (call on logout or user updates).
func (r *CachedSessionRepository) InvalidateToken(ctx context.Context, token string) {
	cacheDel(ctx, r.rdb,
		fmt.Sprintf("session:user:%s", token),
		fmt.Sprintf("session:token:%s", token),
	)
}
