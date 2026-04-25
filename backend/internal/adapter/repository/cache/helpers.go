package cache

import (
	"context"
	"encoding/json"
	"time"

	"github.com/redis/go-redis/v9"
)

// cacheGet retrieves and deserializes a cached value. Returns (value, true) on hit.
func cacheGet[T any](ctx context.Context, rdb *redis.Client, key string) (T, bool) {
	var zero T
	data, err := rdb.Get(ctx, key).Bytes()
	if err != nil {
		return zero, false
	}
	if err := json.Unmarshal(data, &zero); err != nil {
		return zero, false
	}
	return zero, true
}

// cacheSet marshals v and stores it in Redis with the given TTL. Errors are silently ignored
// so a Redis failure never breaks a request.
func cacheSet(ctx context.Context, rdb *redis.Client, key string, v any, ttl time.Duration) {
	data, err := json.Marshal(v)
	if err != nil {
		return
	}
	_ = rdb.Set(ctx, key, data, ttl).Err()
}

// cacheDel removes one or more keys. Errors are silently ignored.
func cacheDel(ctx context.Context, rdb *redis.Client, keys ...string) {
	_ = rdb.Del(ctx, keys...).Err()
}
