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
)

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

	ctx := context.Background()

	// Print current counts
	printCounts(ctx, db)

	if err := seedIncidentTypes(ctx, db); err != nil {
		log.Fatalf("seed incident types: %v", err)
	}
	if err := seedAnonymousReports(ctx, db); err != nil {
		log.Fatalf("seed anonymous reports: %v", err)
	}
	if err := seedOrgReports(ctx, db); err != nil {
		log.Fatalf("seed org reports: %v", err)
	}
	fmt.Println("Seed complete.")
}

func printCounts(ctx context.Context, db *sql.DB) {
	var recentAnon, recentOrgRep, recentInc, totalAnon int
	db.QueryRowContext(ctx, `SELECT COUNT(*) FROM anonymous_incident_reports WHERE created_at >= NOW() - INTERVAL '7 weeks'`).Scan(&recentAnon)
	db.QueryRowContext(ctx, `SELECT COUNT(*) FROM organization_incident_reports WHERE created_at >= NOW() - INTERVAL '7 weeks'`).Scan(&recentOrgRep)
	db.QueryRowContext(ctx, `SELECT COUNT(*) FROM incidents WHERE created_at >= NOW() - INTERVAL '7 weeks'`).Scan(&recentInc)
	db.QueryRowContext(ctx, `SELECT COUNT(*) FROM anonymous_incident_reports`).Scan(&totalAnon)
	fmt.Printf("DB state:\n  anon reports (last 7w): %d / %d total\n  org reports (last 7w): %d\n  form incidents (last 7w): %d\n",
		recentAnon, totalAnon, recentOrgRep, recentInc)
}

var incidentTypes = []struct {
	Name  string
	Color string
}{
	{"Theft", "#ef4444"},
	{"Assault", "#f97316"},
	{"Vandalism", "#f59e0b"},
	{"Harassment", "#8b5cf6"},
	{"Fraud", "#0ea5e9"},
	{"Trespassing", "#10b981"},
	{"Drug Activity", "#ec4899"},
}

func seedIncidentTypes(ctx context.Context, db *sql.DB) error {
	var count int
	if err := db.QueryRowContext(ctx, `SELECT COUNT(*) FROM incident_types`).Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		fmt.Printf("incident_types already has %d rows — skipping\n", count)
		return nil
	}
	now := time.Now()
	for _, t := range incidentTypes {
		desc := fmt.Sprintf("Reports related to %s incidents", t.Name)
		_, err := db.ExecContext(ctx,
			`INSERT INTO incident_types (id, name, description, color, is_active, created_at, updated_at)
			VALUES ($1,$2,$3,$4,true,$5,$6)`,
			uuid.NewString(), t.Name, desc, t.Color, now, now)
		if err != nil {
			return fmt.Errorf("insert incident type %s: %w", t.Name, err)
		}
	}
	fmt.Printf("inserted %d incident types\n", len(incidentTypes))
	return nil
}

func seedAnonymousReports(ctx context.Context, db *sql.DB) error {
	var count int
	if err := db.QueryRowContext(ctx, `SELECT COUNT(*) FROM anonymous_incident_reports`).Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		fmt.Printf("anonymous_incident_reports already has %d rows — skipping\n", count)
		return nil
	}

	rows, err := db.QueryContext(ctx, `SELECT id FROM incident_types WHERE is_active=true`)
	if err != nil {
		return err
	}
	var typeIDs []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			rows.Close()
			return err
		}
		typeIDs = append(typeIDs, id)
	}
	rows.Close()
	if len(typeIDs) == 0 {
		return fmt.Errorf("no incident types found — run seed again after types are inserted")
	}

	// Locations spread across a city
	locations := []struct{ lat, lng float64 }{
		{5.6037, -0.1870},  // Accra
		{5.6145, -0.2057},
		{5.5913, -0.2471},
		{5.5564, -0.1969},
		{5.6299, -0.1659},
		{6.6884, -1.6244},  // Kumasi
		{6.7004, -1.6290},
		{9.4034, -0.8424},  // Tamale
		{5.1053,  1.2466},  // Takoradi
		{7.9528, -1.0238},  // Sunyani
	}

	now := time.Now()
	count = 0
	for weekOffset := 0; weekOffset < 7; weekOffset++ {
		// 3-8 reports per week
		numReports := 3 + rand.Intn(6)
		for j := 0; j < numReports; j++ {
			daysBack := weekOffset*7 + rand.Intn(7)
			createdAt := now.AddDate(0, 0, -daysBack)
			loc := locations[rand.Intn(len(locations))]
			typeID := typeIDs[rand.Intn(len(typeIDs))]
			locJSON, _ := json.Marshal(map[string]any{
				"latitude":  loc.lat,
				"longitude": loc.lng,
				"country":   "Ghana",
			})
			entitiesJSON, _ := json.Marshal([]string{})

			_, err := db.ExecContext(ctx,
				`INSERT INTO anonymous_incident_reports
				(id, incident_type_id, location, description, entities, injuries, fatalities, created_at, updated_at)
				VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
				uuid.NewString(), typeID, locJSON,
				fmt.Sprintf("Sample incident report #%d", count+1),
				string(entitiesJSON), 0, 0, createdAt, createdAt)
			if err != nil {
				return fmt.Errorf("insert anon report: %w", err)
			}
			count++
		}
	}
	fmt.Printf("inserted %d anonymous reports\n", count)
	return nil
}

func seedOrgReports(ctx context.Context, db *sql.DB) error {
	var count int
	if err := db.QueryRowContext(ctx, `SELECT COUNT(*) FROM organization_incident_reports`).Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		fmt.Printf("organization_incident_reports already has %d rows — skipping\n", count)
		return nil
	}

	// Need an org and a user to attach reports to
	var orgID string
	if err := db.QueryRowContext(ctx, `SELECT id FROM organizations LIMIT 1`).Scan(&orgID); err != nil {
		fmt.Println("no organizations found — skipping org report seed")
		return nil
	}
	var userID string
	if err := db.QueryRowContext(ctx, `SELECT id FROM "user" WHERE organization_id=$1 LIMIT 1`, orgID).Scan(&userID); err != nil {
		fmt.Println("no users in org found — skipping org report seed")
		return nil
	}
	rows, err := db.QueryContext(ctx, `SELECT id FROM incident_types WHERE is_active=true`)
	if err != nil {
		return err
	}
	var typeIDs []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			rows.Close()
			return err
		}
		typeIDs = append(typeIDs, id)
	}
	rows.Close()

	severities := []string{"low", "medium", "high", "critical"}
	locJSON, _ := json.Marshal(map[string]any{"latitude": 5.6037, "longitude": -0.187, "country": "Ghana"})
	entitiesJSON, _ := json.Marshal([]string{})
	now := time.Now()
	inserted := 0
	for i := 0; i < 15; i++ {
		daysBack := rand.Intn(49)
		createdAt := now.AddDate(0, 0, -daysBack)
		typeID := typeIDs[rand.Intn(len(typeIDs))]
		sev := severities[rand.Intn(len(severities))]
		_, err := db.ExecContext(ctx,
			`INSERT INTO organization_incident_reports
			(id, organization_id, reported_by_user_id, incident_type_id, location, description,
			 entities, injuries, fatalities, severity, verified, created_at, updated_at)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,false,$11,$12)`,
			uuid.NewString(), orgID, userID, typeID, locJSON,
			fmt.Sprintf("Sample org report #%d", i+1),
			string(entitiesJSON), 0, 0, sev, createdAt, createdAt)
		if err != nil {
			return fmt.Errorf("insert org report: %w", err)
		}
		inserted++
	}
	fmt.Printf("inserted %d org reports\n", inserted)
	return nil
}
