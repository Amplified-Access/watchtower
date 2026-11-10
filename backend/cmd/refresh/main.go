// Command refresh keeps the public maps' demonstration data flowing. Each run
// adds reports for the time since the newest one, at the pace of the 28 days
// before it, so the map never goes quiet and never jumps however often it
// runs. A run straight after another finds no gap and adds next to nothing,
// which matters because the staging and production crons share a database.
//
// With no reports yet to take a pace from, it adds 5–10 over the last week.
package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"math/rand"
	"os"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	_ "github.com/joho/godotenv/autoload"

	"backend/pkg/demoreports"
)

// paceWindow is how far back the pace of reports is measured.
const paceWindow = 28 * 24 * time.Hour

// lockKey serialises runs (pg_advisory_xact_lock), so two crons starting
// together don't both fill the same gap.
const lockKey = 7_412_009

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

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	inserted, since, err := refresh(ctx, db, rand.New(rand.NewSource(time.Now().UnixNano())))
	if err != nil {
		log.Fatalf("refresh: %v", err)
	}
	fmt.Printf("refresh complete: inserted %d anonymous reports since %s\n", inserted, since.Format(time.RFC3339))
}

// refresh runs in one transaction: a partial failure leaves no rows behind.
func refresh(ctx context.Context, db *sql.DB, rng *rand.Rand) (int, time.Time, error) {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return 0, time.Time{}, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback() //nolint:errcheck

	if _, err := tx.ExecContext(ctx, `SELECT pg_advisory_xact_lock($1)`, lockKey); err != nil {
		return 0, time.Time{}, fmt.Errorf("lock: %w", err)
	}

	types, err := activeIncidentTypes(ctx, tx)
	if err != nil {
		return 0, time.Time{}, fmt.Errorf("load incident types: %w", err)
	}
	if len(types) == 0 {
		return 0, time.Time{}, fmt.Errorf("no active incident types found — run the seed command first")
	}

	// created_at has no time zone and holds UTC; read and write it as UTC.
	now := time.Now().UTC()
	var newest sql.NullTime
	if err := tx.QueryRowContext(ctx, `SELECT max(created_at) FROM anonymous_incident_reports`).Scan(&newest); err != nil {
		return 0, time.Time{}, fmt.Errorf("newest report: %w", err)
	}

	var recent int
	if newest.Valid {
		if err := tx.QueryRowContext(ctx,
			`SELECT count(*) FROM anonymous_incident_reports WHERE created_at > $1`,
			newest.Time.Add(-paceWindow)).Scan(&recent); err != nil {
			return 0, time.Time{}, fmt.Errorf("count recent reports: %w", err)
		}
	}

	from := now.Add(-7 * 24 * time.Hour)
	count := 5 + rng.Intn(6) // no pace to follow yet
	if recent > 0 {
		from = newest.Time.UTC()
		count = demoreports.CatchUpCount(rng, recent, paceWindow, now.Sub(from))
	}

	rows := make([]demoreports.Row, count)
	for i := range rows {
		typ := types[rng.Intn(len(types))]
		createdAt := from.Add(time.Duration(rng.Int63n(int64(now.Sub(from)) + 1)))
		rows[i] = demoreports.NewRow(rng, typ.id, typ.name, createdAt)
	}
	if err := demoreports.InsertRows(ctx, tx, rows); err != nil {
		return 0, time.Time{}, err
	}
	if err := tx.Commit(); err != nil {
		return 0, time.Time{}, fmt.Errorf("commit tx: %w", err)
	}
	return count, from, nil
}

func activeIncidentTypes(ctx context.Context, tx *sql.Tx) ([]incidentType, error) {
	rows, err := tx.QueryContext(ctx, `SELECT id, name FROM incident_types WHERE is_active = true`)
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
