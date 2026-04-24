package bootstrap

import (
	"fmt"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	_ "github.com/joho/godotenv/autoload"

	"backend/internal/database"
	redisClient "backend/pkg/redis"
)

type Services struct {
	DB    database.Service
	Redis redisClient.Service
}

func Run() *Services {
	printBanner()

	svc := &Services{}

	step("Database", func() error {
		db, err := database.New()
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

	gin.SetMode(gin.ReleaseMode)

	return svc
}

func step(name string, fn func() error) {
	fmt.Printf("  ♻️   %s connecting...\n", name)
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
