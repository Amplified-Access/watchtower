# Backend Scripts (Makefile)

All commands are run from the `backend/` directory.

## Development

```bash
make watch
```

Starts the server with live reload using [Air](https://github.com/air-verse/air). Air watches `.go`, `.tpl`, `.tmpl`, and `.html` files and re-runs `make build` on any change. Build errors are written to `build-errors.log`.

If Air is not installed, the Makefile installs it automatically via `go install github.com/air-verse/air@latest`.

```bash
make run
```

Runs the server directly without live reload (`go run cmd/api/main.go`). Useful for a quick one-off start.

## Build

```bash
make build
```

Compiles the binary to `main.exe` (`go build -o main.exe cmd/api/main.go`).

```bash
make all
```

Runs `build` then `test` — the default target. Used in CI to verify the build and tests together.

```bash
make clean
```

Removes the compiled binary.

## Database

```bash
make docker-run
```

Starts the local PostgreSQL container via Docker Compose (`docker compose up --build`).

```bash
make docker-down
```

Stops and removes the container (`docker compose down`).

## Testing

```bash
make test
```

Runs the full test suite with verbose output (`go test ./... -v`).

```bash
make itest
```

Runs database integration tests only (`go test ./internal/database -v`). Requires the database container to be running.

## Re-embedding the knowledge base

```
go run ./cmd/reembed              # dry run: embeds everything, writes nothing
go run ./cmd/reembed -apply       # rewrites every vector, after a backup
go run ./cmd/reembed -limit 2     # dry run over the first 2 rows
```

Rewrites every vector in `embeddings` with the current `pkg/gemini.EmbeddingModel`. Vectors made by different models aren't comparable, so **changing the embedding model means running this** — until it's done, the chat assistant's knowledge search matches nothing. It only rewrites the `embedding` column; the chunk text in `content` and the rows in `resources` are untouched. `-apply` writes the old vectors and their text to `reembed-backup-<timestamp>.json` first, and updates every row in one transaction.

Run in September 2026 when Google retired `text-embedding-004`.

## Database seeding

```bash
make seed
```

One-time seed for a fresh database (`go run cmd/seed/main.go`). Inserts incident types and a backfill of anonymous + org reports spread across the last 7 weeks. Each table is skipped if it already has rows, so this is safe to re-run but will not add new data after the first run.

```bash
make refresh
```

Weekly data refresh (`go run cmd/refresh/main.go`). Inserts 5–10 anonymous incident reports dated within the last 7 days. Unlike `seed`, it has no skip-if-exists guard and is designed to run on a repeating schedule.

```bash
make topup TARGET=90962            # dry run: reads only, prints what it would do
make topup TARGET=90962 APPLY=1    # writes it
```

Brings the demonstration data up to `TARGET` anonymous reports (`go run ./cmd/topup`). It adds the reports missing, spread from `-from` (default 2025-05-01) until now and growing busier over time, and rewrites any placeholder reports the old refresh cron wrote ("Weekly refresh report #3 — Nairobi"). Without `APPLY=1` it opens a read-only transaction, so it is safe to point at production. With it, everything runs in one transaction; every added row shares one `updated_at`, which the command prints together with the `DELETE` that removes them again. Running it again once the target is reached adds nothing. Map caches expire within 5 minutes.

**What the reports look like** comes from `pkg/demoreports`, shared by `refresh` and `topup`: 42 towns across Kenya, Uganda, Tanzania, Ethiopia, Rwanda and Pakistan, weighted by size, each report scattered up to 6 km from the town centre; a three-sentence description (what happened, a witness's detail, what has happened since) written for its incident type; and injuries or deaths only when the text says people were hurt. Incident types without sentences of their own get generic ones — add sentences to `byType` in `descriptions.go` when adding a type.

**`DATABASE_URL` in `backend/.env` points at the production Neon database** (as of November 2026), so these commands write to production when run locally. Staging and production share that database too: both Railway environments' API and refresh cron use it.

### Scheduling on Railway

The `watchtower-refresh-cron` service runs in the Railway production environment, and `watchtower-refresh-cron-staging` in staging; `.github/workflows/backend-pipeline.yml` deploys the staging one on pushes to `staging`. Both write to the same database, so the reports grow by about two batches a week.

| Setting | Value |
|---|---|
| Build command | `go build -o /app/refresh ./cmd/refresh` |
| Start command | `/app/refresh` |
| Schedule | `0 0 * * 0` (every Sunday at midnight UTC) |
| Environment | `DATABASE_URL` — same value as the main API service |

The service compiles to a static binary at deploy time so the Go toolchain is not needed at runtime. A manual run can be triggered from the Railway dashboard to verify the first deploy.

## Documentation

```bash
make swagger
```

Regenerates the Swagger API docs from inline annotations (`swag init -g cmd/api/main.go --parseDependency --parseInternal`). Output goes to `docs/` as `docs.go`, `swagger.json`, and `swagger.yaml`.

Requires [swag](https://github.com/swaggo/swag) to be installed:

```bash
go install github.com/swaggo/swag/cmd/swag@latest
```
