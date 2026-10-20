// Package migrations holds the database schema changes, applied in order by
// goose (cmd/migrate, `make migrate`). Each file is one change with an Up
// and a Down section. The schema before the first migration was made by
// Drizzle from the frontend, whose migrations were deleted; goose tracks
// everything since in its goose_db_version table.
package migrations

import "embed"

//go:embed *.sql
var FS embed.FS
