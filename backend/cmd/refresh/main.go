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

// location mirrors entity.Location — stored as JSON in the DB.
type location struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Country   string  `json:"country"`
	Name      string  `json:"name"`
}

// reportingLocations are the cities shown on the live incident map.
var reportingLocations = []location{
	{Latitude: -1.286389, Longitude: 36.817223, Country: "Kenya", Name: "Nairobi"},
	{Latitude: -4.043477, Longitude: 39.668206, Country: "Kenya", Name: "Mombasa"},
	{Latitude: 0.091702, Longitude: 34.767956, Country: "Kenya", Name: "Kisumu"},
	{Latitude: 0.347596, Longitude: 32.582520, Country: "Uganda", Name: "Kampala"},
	{Latitude: 0.671532, Longitude: 30.285832, Country: "Uganda", Name: "Fort Portal"},
	{Latitude: -6.792354, Longitude: 39.208328, Country: "Tanzania", Name: "Dar es Salaam"},
	{Latitude: -3.386925, Longitude: 36.682995, Country: "Tanzania", Name: "Arusha"},
	{Latitude: 9.005401, Longitude: 38.763611, Country: "Ethiopia", Name: "Addis Ababa"},
	{Latitude: 11.593430, Longitude: 37.391304, Country: "Ethiopia", Name: "Bahir Dar"},
	{Latitude: -1.944369, Longitude: 30.061052, Country: "Rwanda", Name: "Kigali"},
	{Latitude: 24.860966, Longitude: 67.010040, Country: "Pakistan", Name: "Karachi"},
	{Latitude: 31.520370, Longitude: 74.358749, Country: "Pakistan", Name: "Lahore"},
	{Latitude: 33.720052, Longitude: 73.057766, Country: "Pakistan", Name: "Islamabad"},
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

	ctx := context.Background()

	typeIDs, err := activeIncidentTypeIDs(ctx, db)
	if err != nil {
		log.Fatalf("load incident types: %v", err)
	}
	if len(typeIDs) == 0 {
		log.Fatal("no active incident types found — run the seed command first")
	}

	inserted, err := insertWeeklyReports(ctx, db, typeIDs)
	if err != nil {
		log.Fatalf("insert reports: %v", err)
	}
	fmt.Printf("refresh complete: inserted %d anonymous reports for the current week\n", inserted)
}

func activeIncidentTypeIDs(ctx context.Context, db *sql.DB) ([]string, error) {
	rows, err := db.QueryContext(ctx, `SELECT id FROM incident_types WHERE is_active = true`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

// insertWeeklyReports inserts 5–10 anonymous reports spread across the last 7 days.
// It has no "skip if exists" guard — safe to run on a schedule.
func insertWeeklyReports(ctx context.Context, db *sql.DB, typeIDs []string) (int, error) {
	now := time.Now()
	numReports := 5 + rand.Intn(6) // 5–10
	entities, _ := json.Marshal([]string{})
	inserted := 0

	for i := range numReports {
		daysBack := rand.Intn(7)
		createdAt := now.AddDate(0, 0, -daysBack)
		loc := reportingLocations[rand.Intn(len(reportingLocations))]
		typeID := typeIDs[rand.Intn(len(typeIDs))]

		locJSON, err := json.Marshal(loc)
		if err != nil {
			return inserted, fmt.Errorf("marshal location: %w", err)
		}

		_, err = db.ExecContext(ctx,
			`INSERT INTO anonymous_incident_reports
			 (id, incident_type_id, location, description, entities, injuries, fatalities, created_at, updated_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
			uuid.NewString(), typeID, string(locJSON),
			fmt.Sprintf("Weekly refresh report #%d — %s", i+1, loc.Name),
			string(entities), 0, 0, createdAt, createdAt,
		)
		if err != nil {
			return inserted, fmt.Errorf("insert report %d: %w", i+1, err)
		}
		inserted++
	}
	return inserted, nil
}
