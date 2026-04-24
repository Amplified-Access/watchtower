package redis

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
	_ "github.com/joho/godotenv/autoload"
)

type Service interface {
	Client() *redis.Client
	Health() map[string]string
	Close() error
}

type service struct {
	client *redis.Client
}

var redisInstance *service

func New() (Service, error) {
	if redisInstance != nil {
		return redisInstance, nil
	}

	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		return nil, fmt.Errorf("REDIS_URL environment variable is not set")
	}

	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse REDIS_URL: %w", err)
	}

	client := redis.NewClient(opts)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect: %w", err)
	}

	redisInstance = &service{client: client}
	return redisInstance, nil
}

func (s *service) Client() *redis.Client {
	return s.client
}

func (s *service) Health() map[string]string {
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	stats := make(map[string]string)

	if err := s.client.Ping(ctx).Err(); err != nil {
		stats["status"] = "down"
		stats["error"] = fmt.Sprintf("redis down: %v", err)
		return stats
	}

	stats["status"] = "up"
	stats["message"] = "It's healthy"

	pool := s.client.PoolStats()
	stats["hits"] = fmt.Sprintf("%d", pool.Hits)
	stats["misses"] = fmt.Sprintf("%d", pool.Misses)
	stats["timeouts"] = fmt.Sprintf("%d", pool.Timeouts)
	stats["total_conns"] = fmt.Sprintf("%d", pool.TotalConns)
	stats["idle_conns"] = fmt.Sprintf("%d", pool.IdleConns)
	stats["stale_conns"] = fmt.Sprintf("%d", pool.StaleConns)

	return stats
}

func (s *service) Close() error {
	return s.client.Close()
}
