package middleware

import (
	"fmt"
	"log/slog"
	"time"

	"github.com/getsentry/sentry-go"
	sentrygin "github.com/getsentry/sentry-go/gin"
	"github.com/gin-gonic/gin"
)

func captureToSentry(c *gin.Context, path string, status int, level sentry.Level) {
	hub := sentrygin.GetHubFromContext(c)
	if hub == nil {
		return
	}
	msg := fmt.Sprintf("%s %s → %d", c.Request.Method, path, status)
	if errs := c.Errors.String(); errs != "" {
		msg += ": " + errs
	}
	hub.WithScope(func(scope *sentry.Scope) {
		scope.SetLevel(level)
		scope.SetTag("method", c.Request.Method)
		scope.SetTag("path", c.Request.URL.Path)
		scope.SetTag("status", fmt.Sprintf("%d", status))
		hub.CaptureMessage(msg)
	})
}

func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		if q := c.Request.URL.RawQuery; q != "" {
			path += "?" + q
		}

		c.Next()

		latency := time.Since(start)
		status := c.Writer.Status()

		attrs := []any{
			slog.String("method", c.Request.Method),
			slog.String("path", path),
			slog.Int("status", status),
			slog.Duration("latency", latency),
			slog.String("ip", c.ClientIP()),
		}

		if errs := c.Errors.String(); errs != "" {
			attrs = append(attrs, slog.String("errors", errs))
		}

		switch {
		case status >= 500:
			slog.Error("request", attrs...)
			captureToSentry(c, path, status, sentry.LevelError)
		case status >= 400:
			slog.Warn("request", attrs...)
			captureToSentry(c, path, status, sentry.LevelWarning)
		default:
			slog.Info("request", attrs...)
		}
	}
}
