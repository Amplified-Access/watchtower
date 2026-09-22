# Backend Packages (`pkg/`)

Reusable service wrappers that abstract infrastructure concerns away from business logic. Each package exposes a `Service` interface and uses a singleton pattern so a single connection is shared across the process lifetime.

## `pkg/postgres`

PostgreSQL connection pool via `jackc/pgx/v5`.

**Interface**:
- `DB() *sql.DB` — returns the shared connection pool
- `Health() map[string]string` — reports pool saturation (open connections, wait count, idle, lifetime-closed)
- `Close() error` — drains and closes the pool

**Configuration**:
- `DATABASE_URL` env var (connection string)
- Max 25 open connections, max 25 idle, 5-minute connection lifetime

**Health thresholds**: warns when open connections exceed 40 or wait count exceeds 1000.

---

## `pkg/redis`

Redis client via `go-redis/v9`.

**Interface**:
- `Client() *redis.Client` — returns the shared client
- `Health() map[string]string` — reports hits, misses, timeouts, total/idle/stale connection counts
- `Close() error` — closes the connection

**Configuration**:
- `REDIS_URL` env var (parsed as `redis://` URL)
- 5-second connection timeout

**Used for**: repository caching (via cache-decorator repositories in `adapter/repository/`) and rate limiting (via the `RateLimit` middleware).

---

## `pkg/email`

Mailjet SMTP email sender.

**Interface**:
- `Send(to, subject, text string, html *string) error` — sends email; pass `nil` for `html` for plain-text only

**Implementation**: `SMTPService` connects over TLS using `PlainAuth`. Multipart messages use a fixed boundary (`==WATCHTOWER_BOUNDARY==`).

**Configuration**:

| Variable            | Description                        |
|---------------------|------------------------------------|
| `SMTP_HOST`         | SMTP server hostname               |
| `SMTP_PORT`         | SMTP server port                   |
| `MAILJET_API_KEY`   | SMTP username (Mailjet API key)    |
| `MAILJET_SECRET_KEY`| SMTP password (Mailjet secret)     |
| `MAIL_FROM_ADDRESS` | Sender email address               |
| `MAIL_FROM_NAME`    | Sender display name                |

---

## `pkg/r2`

Cloudflare R2 file storage through its S3-compatible API (`aws-sdk-go-v2/service/s3`). Used by `usecase/file`, which serves `POST /files` and `GET /files/download`.

**Methods**:
- `Put(ctx, key, contentType, body, size)` — stores a file; `body` must be seekable (a multipart file is) so it's signed without buffering
- `Get(ctx, key)` — opens a stored file; a missing key returns an error wrapping `fs.ErrNotExist`

**Configuration**:
- `CLOUDFLARE_S3_ENDPOINT`, `CLOUDFLARE_ACCESS_KEY_ID`, `CLOUDFLARE_SECRET_KEY`
- `CLOUDFLARE_R2_BUCKET` (default `amplified-access-bucket`)

Missing settings don't stop the server; uploads and downloads return 503 until they're set. Checksums are only sent when required, because R2 doesn't accept every checksum the SDK sends by default.

---

## `pkg/logger`

Structured `slog.Logger` with environment-aware output.

**Factory**: `New() *slog.Logger`

**Behaviour**:
- **Production** (`APP_ENV=production`): JSON output via `slog.NewJSONHandler`
- **Development**: tinted colour output via `lmittmann/tint` with Kitchen-format timestamps

**Configuration**:
- `LOG_LEVEL` — `debug`, `warn`/`warning`, `error`, or omit for `info` (default)
- `APP_ENV` — injected as a tag on every log entry alongside `service=watchtower-api`
