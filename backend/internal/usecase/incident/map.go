package incidentusecase

import (
	"context"
	"math"
	"regexp"
	"sort"
	"strings"
	"time"

	"backend/internal/domain/entity"
	domainerrors "backend/internal/domain/errors"
)

// maxMapQueryLength keeps a search term from turning into an expensive scan.
const maxMapQueryLength = 200

// uuidPattern screens report IDs before they reach Postgres, which would
// otherwise reject a malformed UUID with a server error instead of a 404.
var uuidPattern = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`)

// recentWindow is what "recent reports" counts in a map summary.
const recentWindow = 7 * 24 * time.Hour

func validateMapFilter(f entity.MapFilter) error {
	if f.Period != "" && f.Period.Interval() == "" {
		return domainerrors.NewBadRequest("unknown period: " + string(f.Period))
	}
	if f.Period != "" && (f.From != nil || f.To != nil) {
		return domainerrors.NewBadRequest("use either period or from/to, not both")
	}
	if f.From != nil && f.To != nil && !f.From.Before(*f.To) {
		return domainerrors.NewBadRequest("from must be before to")
	}
	if len(f.Query) > maxMapQueryLength {
		return domainerrors.NewBadRequest("search term is too long")
	}
	return nil
}

func (uc *UseCase) mapRows(ctx context.Context, f entity.MapFilter) ([]*entity.MapReportRow, error) {
	f.Query = strings.TrimSpace(f.Query)
	if err := validateMapFilter(f); err != nil {
		return nil, err
	}
	return uc.anonRepo.FindForMap(ctx, f)
}

// roundCoord trims coordinates to 5 decimal places (about a metre), which is
// finer than any map zoom shows and keeps the payload small.
func roundCoord(v float64) float64 {
	return math.Round(v*1e5) / 1e5
}

// GetMapPoints returns the filtered reports as GeoJSON, ready for a Mapbox
// source, with a bounding box for fitting the camera. Reports with nowhere to
// be placed are left out.
func (uc *UseCase) GetMapPoints(ctx context.Context, f entity.MapFilter) (*entity.MapFeatureCollection, error) {
	rows, err := uc.mapRows(ctx, f)
	if err != nil {
		return nil, err
	}

	fc := &entity.MapFeatureCollection{Type: "FeatureCollection", Features: make([]entity.MapFeature, 0, len(rows))}
	minLon, minLat, maxLon, maxLat := math.Inf(1), math.Inf(1), math.Inf(-1), math.Inf(-1)
	for _, row := range rows {
		coords, ok := row.Location.MapCoordinates()
		if !ok {
			continue
		}
		coords = [2]float64{roundCoord(coords[0]), roundCoord(coords[1])}
		minLon, maxLon = math.Min(minLon, coords[0]), math.Max(maxLon, coords[0])
		minLat, maxLat = math.Min(minLat, coords[1]), math.Max(maxLat, coords[1])

		props := entity.MapFeatureProperties{
			ID:        row.ID,
			Name:      row.Location.DisplayName(),
			CreatedAt: row.CreatedAt,
		}
		if row.Location.Country != nil {
			props.Country = *row.Location.Country
		}
		fc.Features = append(fc.Features, entity.MapFeature{
			Type:       "Feature",
			Geometry:   entity.MapPointGeometry{Type: "Point", Coordinates: coords},
			Properties: props,
		})
	}
	if len(fc.Features) > 0 {
		fc.BBox = []float64{minLon, minLat, maxLon, maxLat}
	}
	return fc, nil
}

// GetMapSummary counts the same reports GetMapPoints would draw, so the
// numbers around a map always match its markers.
func (uc *UseCase) GetMapSummary(ctx context.Context, f entity.MapFilter) (*entity.MapSummary, error) {
	rows, err := uc.mapRows(ctx, f)
	if err != nil {
		return nil, err
	}
	types, err := uc.typeRepo.FindAll(ctx, false)
	if err != nil {
		return nil, err
	}
	typeByID := make(map[string]*entity.IncidentType, len(types))
	for _, t := range types {
		typeByID[t.ID] = t
	}

	summary := &entity.MapSummary{Countries: []entity.MapCountryCount{}, Types: []entity.MapTypeCount{}}
	byCountry := map[string]int{}
	byType := map[string]int{}
	recentSince := time.Now().Add(-recentWindow)
	for _, row := range rows {
		if _, ok := row.Location.MapCoordinates(); !ok {
			continue
		}
		summary.TotalReports++
		if row.CreatedAt.After(recentSince) {
			summary.RecentReports++
		}
		if row.Location.Country != nil && *row.Location.Country != "" {
			byCountry[*row.Location.Country]++
		}
		byType[row.IncidentTypeID]++
	}

	for name, count := range byCountry {
		summary.Countries = append(summary.Countries, entity.MapCountryCount{Name: name, Count: count})
	}
	sort.Slice(summary.Countries, func(i, j int) bool {
		a, b := summary.Countries[i], summary.Countries[j]
		if a.Count != b.Count {
			return a.Count > b.Count
		}
		return a.Name < b.Name
	})

	for id, count := range byType {
		entry := entity.MapTypeCount{ID: id, Count: count, Name: "Incident"}
		if t, ok := typeByID[id]; ok {
			entry.Name = t.Name
			entry.Color = strings.TrimSpace(t.Color)
		}
		summary.Types = append(summary.Types, entry)
	}
	sort.Slice(summary.Types, func(i, j int) bool {
		a, b := summary.Types[i], summary.Types[j]
		if a.Count != b.Count {
			return a.Count > b.Count
		}
		return a.Name < b.Name
	})

	return summary, nil
}

// GetMapReport returns one report's public details for a marker popup.
func (uc *UseCase) GetMapReport(ctx context.Context, id string) (*entity.MapReportDetail, error) {
	if !uuidPattern.MatchString(id) {
		return nil, domainerrors.NewNotFound("report not found")
	}
	r, err := uc.anonRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if r == nil {
		return nil, domainerrors.NewNotFound("report not found")
	}
	detail := &entity.MapReportDetail{
		ID:             r.ID,
		IncidentTypeID: r.IncidentTypeID,
		Name:           r.Location.DisplayName(),
		Description:    r.Description,
		Injuries:       r.Injuries,
		Fatalities:     r.Fatalities,
		CreatedAt:      r.CreatedAt,
	}
	if r.Location.Country != nil {
		detail.Country = *r.Location.Country
	}
	return detail, nil
}
