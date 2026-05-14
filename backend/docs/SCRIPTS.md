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

## Database seeding

```bash
make seed
```

One-time seed for a fresh database (`go run cmd/seed/main.go`). Inserts incident types and a backfill of anonymous + org reports spread across the last 7 weeks. Each table is skipped if it already has rows, so this is safe to re-run but will not add new data after the first run.

```bash
make refresh
```

Weekly data refresh (`go run cmd/refresh/main.go`). Inserts 5–10 anonymous incident reports dated within the last 7 days. Unlike `seed`, it has no skip-if-exists guard and is designed to run on a repeating schedule.

**Locations** are spread across the app's supported countries: Kenya (Nairobi, Mombasa, Kisumu), Uganda (Kampala, Fort Portal), Tanzania (Dar es Salaam, Arusha), Ethiopia (Addis Ababa, Bahir Dar), Rwanda (Kigali), and Pakistan (Karachi, Lahore, Islamabad).

### Scheduling on Railway

To keep the "past week" map filter populated in the deployed app, add a Railway Cron Job service:

| Setting | Value |
|---|---|
| Start command | `go run ./cmd/refresh/main.go` |
| Root directory | `backend` |
| Schedule | `0 0 * * 0` (every Sunday at midnight UTC) |
| Environment | `DATABASE_URL` — same value as the main API service |

## Documentation

```bash
make swagger
```

Regenerates the Swagger API docs from inline annotations (`swag init -g cmd/api/main.go --parseDependency --parseInternal`). Output goes to `docs/` as `docs.go`, `swagger.json`, and `swagger.yaml`.

Requires [swag](https://github.com/swaggo/swag) to be installed:

```bash
go install github.com/swaggo/swag/cmd/swag@latest
```
