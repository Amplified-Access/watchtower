// Command topup brings the public maps' demonstration data up to a target
// number of anonymous reports, and rewrites the placeholder reports the old
// refresh cron left behind ("Weekly refresh report #3 — Nairobi") into ones
// that read like real reports.
//
// It only reads (a dry run) unless -apply is given:
//
//	go run ./cmd/topup -target 90962           # show what would change
//	go run ./cmd/topup -target 90962 -apply    # change it
//
// New reports are spread from -from until now, growing busier over time,
// across the towns in pkg/demoreports. They all carry the same updated_at
// (printed at the end), which is how to find and remove them again.
//
// Everything runs in one transaction: it all lands, or none of it does.
package main

import (
	"context"
	"database/sql"
	"flag"
	"fmt"
	"log"
	"math/rand"
	"os"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	_ "github.com/joho/godotenv/autoload"

	"backend/pkg/demoreports"
)

type incidentType struct {
	id, name string
}

func main() {
	target := flag.Int("target", 0, "total number of anonymous reports wanted (required)")
	fromFlag := flag.String("from", "2025-05-01", "earliest date for new reports, YYYY-MM-DD")
	apply := flag.Bool("apply", false, "write the changes; without it this is a dry run")
	seed := flag.Int64("seed", time.Now().UnixNano(), "random seed, to repeat a run exactly")
	flag.Parse()

	if *target <= 0 {
		log.Fatal("-target is required, e.g. -target 90962")
	}
	from, err := time.ParseInLocation(time.DateOnly, *fromFlag, time.UTC)
	if err != nil {
		log.Fatalf("-from: %v", err)
	}
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL not set")
	}

	db, err := sql.Open("pgx", dbURL)
	if err != nil {
		log.Fatalf("open db: %v", err)
	}
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Minute)
	defer cancel()

	rng := rand.New(rand.NewSource(*seed))
	// One timestamp marks every row this run adds, so it can be undone.
	// created_at and updated_at have no time zone and hold UTC.
	stamp := time.Now().UTC().Truncate(time.Microsecond)

	// A dry run only reads, so it is safe to point at production.
	tx, err := db.BeginTx(ctx, &sql.TxOptions{ReadOnly: !*apply})
	if err != nil {
		log.Fatalf("begin: %v", err)
	}
	defer tx.Rollback() //nolint:errcheck

	types, err := activeTypes(ctx, tx)
	if err != nil {
		log.Fatalf("load incident types: %v", err)
	}
	if len(types) == 0 {
		log.Fatal("no active incident types — run the seed command first")
	}

	var current int
	if err := tx.QueryRowContext(ctx, `SELECT count(*) FROM anonymous_incident_reports`).Scan(&current); err != nil {
		log.Fatalf("count reports: %v", err)
	}

	rewritten, err := rewritePlaceholders(ctx, tx, rng, *apply)
	if err != nil {
		log.Fatalf("rewrite placeholders: %v", err)
	}

	missing := max(*target-current, 0)
	rows := make([]demoreports.Row, missing)
	for i := range rows {
		typ := types[rng.Intn(len(types))]
		rows[i] = demoreports.NewRow(rng, typ.id, typ.name, demoreports.RampedTime(rng, from, stamp))
		rows[i].UpdatedAt = stamp
	}
	if *apply {
		if err := demoreports.InsertRows(ctx, tx, rows); err != nil {
			log.Fatalf("insert reports: %v", err)
		}
	}

	fmt.Printf("reports now:            %d\n", current)
	fmt.Printf("placeholders rewritten: %d\n", rewritten)
	fmt.Printf("reports to add:         %d (from %s, spread over %d incident types)\n", missing, from.Format(time.DateOnly), len(types))
	fmt.Printf("reports after:          %d\n", current+missing)
	if len(rows) > 0 {
		fmt.Println("\nsample of new reports:")
		for _, r := range rows[:min(3, len(rows))] {
			fmt.Printf("  %s  %s\n    %s\n", r.CreatedAt.Format(time.DateOnly), r.Location, r.Description)
		}
	}

	if !*apply {
		fmt.Println("\ndry run: nothing written. Add -apply to write it.")
		return
	}
	if err := tx.Commit(); err != nil {
		log.Fatalf("commit: %v", err)
	}
	fmt.Printf("\ndone. To remove the added reports again:\n  DELETE FROM anonymous_incident_reports WHERE updated_at = '%s';\n",
		stamp.Format("2006-01-02 15:04:05.999999"))
	fmt.Println("(cached map data expires within 5 minutes)")
}

func activeTypes(ctx context.Context, tx *sql.Tx) ([]incidentType, error) {
	rows, err := tx.QueryContext(ctx, `SELECT id, name FROM incident_types WHERE is_active = true ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []incidentType
	for rows.Next() {
		var t incidentType
		if err := rows.Scan(&t.id, &t.name); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

// rewritePlaceholders gives each of the old cron's placeholder reports a
// description and casualties fitting its incident type and town, and moves
// it off the town's exact centre (where the old cron stacked them) to a
// point scattered over the town. Its date, town and type stay as they are.
func rewritePlaceholders(ctx context.Context, tx *sql.Tx, rng *rand.Rand, write bool) (int, error) {
	rows, err := tx.QueryContext(ctx, `
		SELECT r.id, t.name, COALESCE(r.location->>'name', '')
		FROM anonymous_incident_reports r JOIN incident_types t ON t.id = r.incident_type_id
		WHERE r.description LIKE 'Weekly refresh report%'`)
	if err != nil {
		return 0, err
	}
	type placeholder struct{ id, typeName, town string }
	var found []placeholder
	for rows.Next() {
		var p placeholder
		if err := rows.Scan(&p.id, &p.typeName, &p.town); err != nil {
			rows.Close()
			return 0, err
		}
		found = append(found, p)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return 0, err
	}

	for _, p := range found {
		place, ok := demoreports.PlaceNamed(p.town)
		if !ok {
			place = demoreports.RandomPlace(rng)
		}
		r := demoreports.NewReport(rng, p.typeName, place.Name)
		loc := demoreports.LocationJSON(rng, place)
		if !write {
			continue
		}
		if _, err := tx.ExecContext(ctx,
			`UPDATE anonymous_incident_reports
			 SET description = $2, injuries = $3, fatalities = $4, location = $5
			 WHERE id = $1`,
			p.id, r.Description, r.Injuries, r.Fatalities, string(loc)); err != nil {
			return 0, err
		}
	}
	return len(found), nil
}
