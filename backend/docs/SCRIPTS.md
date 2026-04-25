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

## Documentation

```bash
make swagger
```

Regenerates the Swagger API docs from inline annotations (`swag init -g cmd/api/main.go --parseDependency --parseInternal`). Output goes to `docs/` as `docs.go`, `swagger.json`, and `swagger.yaml`.

Requires [swag](https://github.com/swaggo/swag) to be installed:

```bash
go install github.com/swaggo/swag/cmd/swag@latest
```
