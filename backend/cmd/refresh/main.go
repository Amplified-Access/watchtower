package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"os"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	_ "github.com/joho/godotenv/autoload"

	"github.com/google/uuid"

	"backend/pkg/demoreports"
)

const emptyEntities = "{}" // PostgreSQL text[] literal for an empty array

// location mirrors entity.Location — stored as JSON in the DB.
type location struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Country   string  `json:"country"`
	Name      string  `json:"name"`
}

type incidentType struct {
	id, name string
}

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL not set")
	}

	db, err := sql.Open("pgx", dbURL)
	if err != nil {
		log.Fatalf("open db: %v", err)
	}
	defer db.Close()

	pingCtx, pingCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer pingCancel()
	if err := db.PingContext(pingCtx); err != nil {
		log.Fatalf("ping db: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	types, err := activeIncidentTypes(ctx, db)
	if err != nil {
		log.Fatalf("load incident types: %v", err)
	}
	if len(types) == 0 {
		log.Fatal("no active incident types found — run the seed command first")
	}

	inserted, err := insertWeeklyReports(ctx, db, types)
	if err != nil {
		log.Fatalf("insert reports: %v", err)
	}
	fmt.Printf("refresh complete: inserted %d anonymous reports for the current week\n", inserted)
}

func activeIncidentTypes(ctx context.Context, db *sql.DB) ([]incidentType, error) {
	rows, err := db.QueryContext(ctx, `SELECT id, name FROM incident_types WHERE is_active = true`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var types []incidentType
	for rows.Next() {
		var t incidentType
		if err := rows.Scan(&t.id, &t.name); err != nil {
			return nil, err
		}
		types = append(types, t)
	}
	return types, rows.Err()
}

// insertWeeklyReports inserts 5–10 anonymous reports spread across the last 7 days,
// written by pkg/demoreports so they read like the rest of the demonstration data.
// It has no "skip if exists" guard — safe to run on a schedule.
// All inserts run in a single transaction so a partial failure leaves no orphaned rows.
func insertWeeklyReports(ctx context.Context, db *sql.DB, types []incidentType) (int, error) {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return 0, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback() //nolint:errcheck

	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	now := time.Now()
	numReports := 5 + rng.Intn(6) // 5–10
	inserted := 0

	for i := range numReports {
		createdAt := now.Add(-time.Duration(rng.Int63n(int64(7 * 24 * time.Hour))))
		place := demoreports.RandomPlace(rng)
		typ := types[rng.Intn(len(types))]
		lat, lon := demoreports.Scatter(rng, place.Latitude, place.Longitude)
		report := demoreports.NewReport(rng, typ.name, place.Name)

		locJSON, err := json.Marshal(location{Latitude: lat, Longitude: lon, Country: place.Country, Name: place.Name})
		if err != nil {
			return 0, fmt.Errorf("marshal location: %w", err)
		}

		_, err = tx.ExecContext(ctx,
			`INSERT INTO anonymous_incident_reports
			 (id, incident_type_id, location, description, entities, injuries, fatalities, created_at, updated_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
			uuid.NewString(), typ.id, string(locJSON), report.Description,
			emptyEntities, report.Injuries, report.Fatalities, createdAt, createdAt,
		)
		if err != nil {
			return 0, fmt.Errorf("insert report %d: %w", i+1, err)
		}
		inserted++
	}

	if err := tx.Commit(); err != nil {
		return 0, fmt.Errorf("commit tx: %w", err)
	}
	return inserted, nil
}
