package demoreports

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"math"
	"math/rand"
	"strings"
	"time"

	"github.com/google/uuid"
)

// Row is a demonstration report ready to insert into anonymous_incident_reports.
type Row struct {
	ID          string
	TypeID      string
	Location    []byte
	Description string
	Injuries    int
	Fatalities  int
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// location mirrors entity.Location as the reports table stores it.
type location struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Country   string  `json:"country"`
	Name      string  `json:"name"`
}

// LocationJSON is a point scattered over the town, as the reports table stores it.
func LocationJSON(rng *rand.Rand, place Place) []byte {
	lat, lon := place.Scatter(rng)
	b, _ := json.Marshal(location{Latitude: lat, Longitude: lon, Country: place.Country, Name: place.Name})
	return b
}

// NewRow makes a report of the given type from a random town. createdAt
// must be UTC: the column has no time zone, so the driver stores the clock
// time as given.
func NewRow(rng *rand.Rand, typeID, typeName string, createdAt time.Time) Row {
	place := RandomPlace(rng)
	report := NewReport(rng, typeName, place.Name)
	return Row{
		ID:          uuid.NewString(),
		TypeID:      typeID,
		Location:    LocationJSON(rng, place),
		Description: report.Description,
		Injuries:    report.Injuries,
		Fatalities:  report.Fatalities,
		CreatedAt:   createdAt,
		UpdatedAt:   createdAt,
	}
}

// insertBatch keeps each INSERT under Postgres's 65,535 parameter limit
// (8 parameters × 1,000 rows) while needing few round trips.
const insertBatch = 1000

// InsertRows inserts the rows in batches inside tx.
func InsertRows(ctx context.Context, tx *sql.Tx, rows []Row) error {
	for start := 0; start < len(rows); start += insertBatch {
		batch := rows[start:min(start+insertBatch, len(rows))]
		var sb strings.Builder
		sb.WriteString(`INSERT INTO anonymous_incident_reports
			(id, incident_type_id, location, description, entities, injuries, fatalities, created_at, updated_at) VALUES `)
		args := make([]any, 0, len(batch)*8)
		for i, r := range batch {
			if i > 0 {
				sb.WriteString(",")
			}
			n := len(args)
			fmt.Fprintf(&sb, "($%d, $%d, $%d, $%d, '{}', $%d, $%d, $%d, $%d)", n+1, n+2, n+3, n+4, n+5, n+6, n+7, n+8)
			args = append(args, r.ID, r.TypeID, string(r.Location), r.Description, r.Injuries, r.Fatalities, r.CreatedAt, r.UpdatedAt)
		}
		if _, err := tx.ExecContext(ctx, sb.String(), args...); err != nil {
			return fmt.Errorf("rows %d–%d: %w", start, start+len(batch), err)
		}
	}
	return nil
}

// growthPerDay makes each catch-up a little busier than the weeks before,
// about 3% a month, continuing the top-up's rising curve.
const growthPerDay = 1.001

// maxCatchUp bounds one run, in case the clock or the data is badly off.
const maxCatchUp = 20000

// CatchUpCount is how many reports fill a gap at the pace of the reports
// before it: recent reports were made in the window leading up to the gap.
// The fraction left over is rounded up or down at random, so short gaps
// still get their share on average.
func CatchUpCount(rng *rand.Rand, recent int, window, gap time.Duration) int {
	if recent <= 0 || window <= 0 || gap <= 0 {
		return 0
	}
	days := gap.Hours() / 24
	want := float64(recent) / window.Hours() * gap.Hours() * math.Pow(growthPerDay, days)
	n := int(want)
	if rng.Float64() < want-float64(n) {
		n++
	}
	return min(n, maxCatchUp)
}
