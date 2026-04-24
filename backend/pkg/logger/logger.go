package logger

import (
	"log/slog"
	"os"
	"strings"
	"time"

	"github.com/lmittmann/tint"
	_ "github.com/joho/godotenv/autoload"
)

func New() *slog.Logger {
	level := parseLevel(os.Getenv("LOG_LEVEL"))

	var handler slog.Handler
	if os.Getenv("APP_ENV") == "production" {
		handler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: level})
	} else {
		handler = tint.NewHandler(os.Stdout, &tint.Options{
			Level:      level,
			TimeFormat: time.Kitchen,
		})
	}

	log := slog.New(handler).With(
		slog.String("service", "watchtower-api"),
		slog.String("env", currentEnv()),
	)

	slog.SetDefault(log)
	return log
}

func parseLevel(s string) slog.Level {
	switch strings.ToLower(s) {
	case "debug":
		return slog.LevelDebug
	case "warn", "warning":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}

func currentEnv() string {
	if e := os.Getenv("APP_ENV"); e != "" {
		return e
	}
	return "development"
}
