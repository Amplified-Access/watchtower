package middleware

import (
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

// incrScript atomically increments a counter and sets its TTL on first use.
var incrScript = redis.NewScript(`
	local count = redis.call('INCR', KEYS[1])
	if count == 1 then
		redis.call('EXPIRE', KEYS[1], ARGV[1])
	end
	return count
`)

// RateLimit returns a middleware that enforces a fixed-window rate limit using Redis.
// On Redis failure the request is allowed through (fail-open) to avoid cascading downtime.
func RateLimit(rdb *redis.Client, limit int, window time.Duration, keyFn func(*gin.Context) string) gin.HandlerFunc {
	windowSecs := strconv.Itoa(int(window.Seconds()))
	limitStr := strconv.Itoa(limit)

	return func(c *gin.Context) {
		key := "rl:" + keyFn(c)

		count, err := incrScript.Run(c.Request.Context(), rdb, []string{key}, windowSecs).Int()
		if err != nil {
			slog.Warn("rate limiter redis error, failing open", "key", key, "error", err)
			c.Next()
			return
		}

		remaining := max(0, limit-count)

		c.Header("X-RateLimit-Limit", limitStr)
		c.Header("X-RateLimit-Remaining", strconv.Itoa(remaining))
		c.Header("X-RateLimit-Reset", strconv.FormatInt(time.Now().Add(window).Unix(), 10))

		if count > limit {
			c.Header("Retry-After", windowSecs)
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "rate limit exceeded"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// PublicIPKey keys by client IP for general public routes (60 req/min).
func PublicIPKey(c *gin.Context) string {
	return "pub:" + c.ClientIP()
}

// StrictIPKey keys by client IP for sensitive write endpoints (10 req/min).
func StrictIPKey(c *gin.Context) string {
	return "strict:" + c.ClientIP()
}

// AuthUserKey keys by authenticated user ID, falling back to IP for unauthenticated callers.
func AuthUserKey(c *gin.Context) string {
	if user := CurrentUser(c); user != nil {
		return "user:" + user.ID
	}
	return "anon:" + c.ClientIP()
}
