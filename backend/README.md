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
├── pkg/                   # Shared utilities (email, postgres, redis, etc.)
└── docs/                  # Auto-generated Swagger API documentation
```

**Dependency rule**: domain ← usecase ← adapter ← server. Outer layers depend on inner layers, never the reverse.

## API

Base path: `/api/v1`

Route groups:
- **Public** — unauthenticated access (incident listing, org directory, public reports)
- **Authenticated** — requires Bearer token (reporting, alert subscriptions, notifications)
- **Admin** — organization admins (incident management, form configuration, analytics)
- **Super Admin** — platform-wide oversight and analytics

Interactive Swagger UI is available at `/swagger/index.html` when the server is running.

Full API reference: [`docs/`](./docs/)

## Rate Limiting

| Route group   | Limit         |
|---------------|---------------|
| Public        | 60 req/min    |
| Strict public | 10 req/min    |
| Authenticated | 200 req/min   |

## Make Commands

```bash
# Build and run tests
make all

# Build the binary
make build

# Run the server
make run

# Start the local PostgreSQL container
make docker-run

# Stop the PostgreSQL container
make docker-down

# Run with live reload (requires air)
make watch

# Run the full test suite
make test

# Run database integration tests
make itest

# Remove the built binary
make clean
```

## Local Development

**Prerequisites**: Go 1.25+, Docker

```bash
# 1. Start the database
make docker-run

# 2. Copy and configure environment variables
cp .env.example .env

# 3. Start the server with live reload
make watch
```

The API will be available at `http://localhost:8080`.

## Environment Variables

| Variable              | Description                                  |
|-----------------------|----------------------------------------------|
| `DATABASE_URL`        | PostgreSQL connection string                 |
| `REDIS_URL`           | Redis connection string                      |
| `JWT_SECRET`          | Secret for signing auth tokens               |
| `AWS_ACCESS_KEY_ID`   | S3-compatible storage key (Cloudflare R2)    |
| `AWS_SECRET_KEY`      | S3-compatible storage secret                 |
| `AWS_BUCKET_NAME`     | Storage bucket name                          |
| `AWS_ENDPOINT_URL`    | R2 endpoint URL                              |
| `SNS_TOPIC_ARN`       | AWS SNS topic for push notifications         |
| `MAILJET_API_KEY`     | Mailjet API key for email delivery           |
| `MAILJET_SECRET_KEY`  | Mailjet secret key                           |
| `SENTRY_DSN`          | Sentry error tracking DSN                    |
| `GEMINI_API_KEY`      | Google Generative AI key for insights        |
| `PORT`                | Server port (default: `8080`)                |

## Deployment

The backend deploys to Railway via GitHub Actions on pushes to `staging` and `production` branches. The pipeline runs `go test ./...` before deploying.
