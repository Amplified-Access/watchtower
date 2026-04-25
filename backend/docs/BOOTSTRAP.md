# Bootstrap and Startup

The `internal/bootstrap` package initialises all shared services before the HTTP server starts, and `cmd/api/main.go` wires the full startup and shutdown lifecycle.

## Startup Order

`bootstrap.Run()` executes steps sequentially. Any fatal error calls `os.Exit(1)`.

| Step | Package | Fatal? | Notes |
|------|---------|--------|-------|
| 1. Logger | `pkg/logger` | Yes | Must succeed — all subsequent output depends on it |
| 2. Database | `pkg/postgres` | Yes | Connection pool; exits if Postgres is unreachable |
| 3. Redis | `pkg/redis` | Yes | Client init; exits if Redis is unreachable |
| 4. Sentry | — | No | Only initialised when `SENTRY_DSN` is set; silently skipped otherwise |
| 5. Gin mode | — | No | Forced to `ReleaseMode` regardless of `APP_ENV` |

Each step is timed and printed by a `step()` helper so startup output shows which service is slow or failing.

On success, `bootstrap.Run()` returns a `Services` struct:

```go
type Services struct {
    Logger *slog.Logger
    DB     postgres.Service
    Redis  redis.Service
}
```

## Dependency Injection

`server.NewServer(db, redis)` receives the `Services` values and wires the full dependency graph by hand — there is no DI framework.

The wiring order inside `NewServer`:

1. **Raw repositories** — Postgres implementations with no caching layer (users, org applications, org incident reports, reports, alerts).
2. **Cached repositories** — Redis cache decorators wrapping Postgres repos for performance-sensitive reads (sessions, organisations, forms, incident types, incidents, anonymous reports, insights, datasets).
3. **Use cases** — constructed from repository interfaces; no direct Postgres or Redis imports.
4. **Email service** — `pkg/email.New()`.
5. **Handlers** — each wraps exactly one use case (plus email service where needed).
6. **HTTP server** — `http.Server` with timeouts: idle 1 min, read 10 s, write 30 s.

## Graceful Shutdown

`main.go` starts a `gracefulShutdown` goroutine before calling `ListenAndServe`. The goroutine:

1. Blocks on `SIGINT` or `SIGTERM`.
2. Calls `srv.Shutdown(ctx)` with a 5-second context timeout.
3. Logs whether the shutdown was clean or forced (timeout exceeded).
4. Signals the main goroutine via a done channel so the process exits cleanly.
