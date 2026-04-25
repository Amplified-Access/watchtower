# Watchtower Backend

Go REST API for the Watchtower incident monitoring platform. Built with Clean Architecture — business logic is fully decoupled from HTTP, database, and external service concerns.

## Architecture

The backend follows Clean Architecture with strict inward dependency rules:

```
backend/
├── cmd/api/               # Entrypoint — wires dependencies and starts the server
├── internal/
│   ├── domain/            # Pure business rules: entities, repository interfaces, domain errors
│   ├── usecase/           # Use cases that orchestrate domain logic (no framework imports)
│   ├── adapter/
│   │   ├── handler/       # HTTP request handlers
│   │   ├── middleware/    # Auth, rate limiting, logging, CORS
│   │   ├── presenter/     # Response serialization
│   │   └── repository/    # Postgres + Redis cache implementations
│   ├── server/            # Route registration and server initialization
│   ├── bootstrap/         # Application startup and dependency injection
│   └── database/          # Database connection setup
├── pkg/                   # Shared service wrappers (postgres, redis, email, logger)
└── docs/                  # API docs and reference
```

**Dependency rule**: domain ← usecase ← adapter ← server. Outer layers depend on inner layers, never the reverse.

## Architecture Decisions

**Manual dependency injection**
There is no DI framework. `server.NewServer()` wires the entire dependency graph by hand: raw Postgres repositories are created first, then wrapped in Redis cache decorators, then passed into use-case constructors, then into HTTP handlers. The wiring is explicit, traceable, and has no runtime magic.

**Repository cache decorator pattern**
Performance-sensitive repositories (orgs, incidents, forms, insights, etc.) are wrapped in `Cached*Repository` adapters that sit between the use case and the Postgres implementation. The cache layer uses Redis with short TTLs. Swapping or disabling caching requires changing only the wiring in `server.go` — use-case and repository interface code is untouched.

**Dual-path auth token extraction**
The `Auth` middleware accepts a Bearer token from either the `Authorization` header (used by API clients) or the `better-auth.session_token` cookie (used by the Next.js frontend). This avoids duplicating middleware or routing for browser vs. programmatic clients.

**Lua-script rate limiting**
The rate limiter executes a single Lua script atomically on Redis. This makes the increment-and-check race-free across multiple server instances without a distributed lock. The TTL is set only on the first request in each window, so subsequent requests do not extend it.

**Fail-open on Redis errors**
If Redis is unavailable during a rate-limit check, the request is allowed through. Availability is prioritised over strict rate enforcement.

**Sentry at the middleware level**
Request logging and Sentry capture are combined in a single middleware (`adapter/middleware/logger.go`). 4xx responses are captured at `WARNING` level; 5xx at `ERROR`. Tags include method, path, and status code. Handlers carry no observability concerns.

## API

Base path: `/api/v1`

| Route group     | Auth             | Description                                          |
|-----------------|------------------|------------------------------------------------------|
| Public          | None             | Incident listing, org directory, public reports      |
| Authenticated   | Bearer token     | Reporting, alert subscriptions, notifications        |
| Admin           | Admin role       | Incident management, form config, analytics          |
| Super Admin     | Super Admin role | Platform-wide oversight and analytics                |

Swagger UI: `http://localhost:8080/swagger/index.html`

Full API reference: [`docs/API.md`](./docs/API.md)

## Local Development

**Prerequisites**: Go 1.25+, Docker

```bash
# Start the database container
make docker-run

# Copy and configure environment variables
cp .env.example .env

# Start the server with live reload
make watch
```

See [`docs/SCRIPTS.md`](./docs/SCRIPTS.md) for all available Make commands.

## Environment Variables

| Variable              | Description                                  |
|-----------------------|----------------------------------------------|
| `DATABASE_URL`        | PostgreSQL connection string                 |
| `REDIS_URL`           | Redis connection string                      |
| `JWT_SECRET`          | Secret for signing auth tokens               |
| `APP_ENV`             | Environment name (`production`, `development`)|
| `LOG_LEVEL`           | Log verbosity (`debug`, `info`, `warn`, `error`) |
| `PORT`                | Server port (default: `8080`)                |
| `AWS_ACCESS_KEY_ID`   | S3-compatible storage key (Cloudflare R2)    |
| `AWS_SECRET_KEY`      | S3-compatible storage secret                 |
| `AWS_BUCKET_NAME`     | Storage bucket name                          |
| `AWS_ENDPOINT_URL`    | R2 endpoint URL                              |
| `SNS_TOPIC_ARN`       | AWS SNS topic for push notifications         |
| `SMTP_HOST`           | SMTP server hostname                         |
| `SMTP_PORT`           | SMTP server port                             |
| `MAILJET_API_KEY`     | Mailjet API key (SMTP username)              |
| `MAILJET_SECRET_KEY`  | Mailjet secret key (SMTP password)           |
| `MAIL_FROM_ADDRESS`   | Sender email address                         |
| `MAIL_FROM_NAME`      | Sender display name                          |
| `SENTRY_DSN`          | Sentry DSN (optional — skipped if unset)     |
| `GEMINI_API_KEY`      | Google Generative AI key for insights        |

## Deployment

Deploys to Railway via GitHub Actions on pushes to `staging` and `production` branches. The pipeline runs `go test ./...` before every deploy.

## Further Reading

| Document | Description |
|----------|-------------|
| [`docs/API.md`](./docs/API.md) | API reference, route groups, rate limits, error format |
| [`docs/PACKAGES.md`](./docs/PACKAGES.md) | `pkg/` service wrappers in detail |
| [`docs/BOOTSTRAP.md`](./docs/BOOTSTRAP.md) | Startup sequence and DI wiring |
| [`docs/SCRIPTS.md`](./docs/SCRIPTS.md) | All Make commands explained |
