package bootstrap

import (
	"fmt"
	"log/slog"
	"os"
	"time"

	"github.com/getsentry/sentry-go"
	"github.com/gin-gonic/gin"
	_ "github.com/joho/godotenv/autoload"

	"backend/pkg/logger"
	pgClient "backend/pkg/postgres"
	redisClient "backend/pkg/redis"
)

type Services struct {
	Logger *slog.Logger
	DB     pgClient.Service
	Redis  redisClient.Service
}

func Run() *Services {
	printBanner()

	svc := &Services{}
	svc.Logger = logger.New()

	step("Database", func() error {
		db, err := pgClient.New()
		if err != nil {
			return err
		}
		svc.DB = db
		return nil
	})

	step("Redis", func() error {
		r, err := redisClient.New()
		if err != nil {
			return err
		}
		svc.Redis = r
		return nil
	})

	if dsn := os.Getenv("SENTRY_DSN"); dsn != "" {
		step("Sentry", func() error {
			return sentry.Init(sentry.ClientOptions{
				Dsn:              dsn,
				Environment:      os.Getenv("APP_ENV"),
				TracesSampleRate: 1.0,
			})
		})
	}

	gin.SetMode(gin.ReleaseMode)

	return svc
}

func step(name string, fn func() error) {
	fmt.Printf("  ♻️   %s initializing...\n", name)
	start := time.Now()
	if err := fn(); err != nil {
		fmt.Printf("  ❌  %s failed: %v\n\n", name, err)
		os.Exit(1)
	}
	fmt.Printf("  ✅  %s ready (%s)\n\n", name, time.Since(start).Round(time.Millisecond))
}

func printBanner() {
	fmt.Println()
	fmt.Println("  ┌──────────────────────────────────────┐")
	fmt.Println("  │            Watchtower-API            │")
	fmt.Println("  └──────────────────────────────────────┘")
	fmt.Println()
}
