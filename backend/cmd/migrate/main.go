// Command migrate applies the schema changes in backend/migrations with
// goose: `go run cmd/migrate/main.go [up|down|status]` (default up), or
// `make migrate`. It uses DATABASE_URL, loaded from .env like the API.
package main

import (
	"log"
	"os"

	"github.com/pressly/goose/v3"

	"backend/internal/database"
	"backend/migrations"
)

func main() {
	command := "up"
	if len(os.Args) > 1 {
		command = os.Args[1]
	}

	db, err := database.New()
	if err != nil {
		log.Fatalf("connect: %v", err)
	}
	defer db.Close()

	goose.SetBaseFS(migrations.FS)
	if err := goose.SetDialect("postgres"); err != nil {
		log.Fatalf("dialect: %v", err)
	}
	if err := goose.Run(command, db.DB(), "."); err != nil {
		log.Fatalf("migrate %s: %v", command, err)
	}
}
