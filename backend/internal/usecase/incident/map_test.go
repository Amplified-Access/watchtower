package incidentusecase

import (
	"context"
	"errors"
	"testing"
	"time"

	"backend/internal/domain/entity"
	domainerrors "backend/internal/domain/errors"
	"backend/internal/domain/repository"
)

// ─── Mocks ───────────────────────────────────────────────────────────────────

type mockAnonRepo struct {
	repository.AnonymousIncidentReportRepository
	rows       []*entity.MapReportRow
	report     *entity.AnonymousIncidentReport
	err        error
	lastFilter entity.MapFilter
	calls      int
}

func (m *mockAnonRepo) FindForMap(_ context.Context, f entity.MapFilter) ([]*entity.MapReportRow, error) {
	m.calls++
	m.lastFilter = f
	return m.rows, m.err
}

func (m *mockAnonRepo) FindByID(_ context.Context, _ string) (*entity.AnonymousIncidentReport, error) {
	return m.report, m.err
}

type mockTypeRepo struct {
	repository.IncidentTypeRepository
	types []*entity.IncidentType
}

func (m *mockTypeRepo) FindAll(_ context.Context, _ bool) ([]*entity.IncidentType, error) {
	return m.types, nil
}

func strPtr(s string) *string { return &s }

func newMapUseCase(anon *mockAnonRepo, types []*entity.IncidentType) *UseCase {
	return New(nil, &mockTypeRepo{types: types}, anon, nil)
}

const reportID = "9beeb74f-68a5-462d-b687-55fb4748bcfa"

// ─── GetMapPoints ────────────────────────────────────────────────────────────

func TestGetMapPoints_BuildsGeoJSONWithBBox(t *testing.T) {
	now := time.Now()
	anon := &mockAnonRepo{rows: []*entity.MapReportRow{
		{ID: "a", Location: entity.Location{Latitude: -1.2863891, Longitude: 36.8172231, Name: strPtr("Nairobi"), Country: strPtr("Kenya")}, CreatedAt: now},
		{ID: "b", Location: entity.Location{Latitude: 24.86, Longitude: 67.01, Country: strPtr("Pakistan")}, CreatedAt: now},
	}}
	fc, err := newMapUseCase(anon, nil).GetMapPoints(context.Background(), entity.MapFilter{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if fc.Type != "FeatureCollection" || len(fc.Features) != 2 {
		t.Fatalf("want a 2-feature collection, got %+v", fc)
	}
	first := fc.Features[0]
	if first.Geometry.Coordinates != [2]float64{36.81722, -1.28639} {
		t.Errorf("coordinates should be [lon, lat] rounded to 5dp, got %v", first.Geometry.Coordinates)
	}
	if first.Properties.Name != "Nairobi" || first.Properties.Country != "Kenya" {
		t.Errorf("unexpected properties %+v", first.Properties)
	}
	if fc.Features[1].Properties.Name != "Pakistan" {
		t.Errorf("name should fall back to the country, got %q", fc.Features[1].Properties.Name)
	}
	want := []float64{36.81722, -1.28639, 67.01, 24.86}
	for i := range want {
		if fc.BBox[i] != want[i] {
			t.Fatalf("bbox = %v, want %v", fc.BBox, want)
		}
	}
}

func TestGetMapPoints_ZeroCoordinatesFallBackToCountryCentre(t *testing.T) {
	anon := &mockAnonRepo{rows: []*entity.MapReportRow{
		{ID: "a", Location: entity.Location{Country: strPtr("Uganda")}},
		{ID: "b", Location: entity.Location{Country: strPtr("Atlantis")}},
		{ID: "c", Location: entity.Location{}},
	}}
	fc, err := newMapUseCase(anon, nil).GetMapPoints(context.Background(), entity.MapFilter{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(fc.Features) != 1 {
		t.Fatalf("only the report with a known country should be placed, got %d", len(fc.Features))
	}
	if fc.Features[0].Geometry.Coordinates != [2]float64{32.2903, 1.3733} {
		t.Errorf("want Uganda's centre, got %v", fc.Features[0].Geometry.Coordinates)
	}
}

func TestGetMapPoints_EmptyHasNoBBox(t *testing.T) {
	fc, err := newMapUseCase(&mockAnonRepo{}, nil).GetMapPoints(context.Background(), entity.MapFilter{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if fc.BBox != nil || fc.Features == nil || len(fc.Features) != 0 {
		t.Errorf("want an empty (non-nil) feature list and no bbox, got %+v", fc)
	}
}

func TestGetMapPoints_TrimsQueryBeforeTheRepository(t *testing.T) {
	anon := &mockAnonRepo{}
	_, _ = newMapUseCase(anon, nil).GetMapPoints(context.Background(), entity.MapFilter{Query: "  water  "})
	if anon.lastFilter.Query != "water" {
		t.Errorf("query should be trimmed, got %q", anon.lastFilter.Query)
	}
}

func TestGetMapPoints_RejectsBadFilters(t *testing.T) {
	from := time.Date(2026, 9, 10, 0, 0, 0, 0, time.UTC)
	to := from.AddDate(0, 0, -1)
	long := make([]byte, maxMapQueryLength+1)
	for i := range long {
		long[i] = 'a'
	}
	cases := map[string]entity.MapFilter{
		"unknown period":     {Period: "fortnight"},
		"period and range":   {Period: entity.MapPeriod7d, From: &from},
		"range out of order": {From: &from, To: &to},
		"query too long":     {Query: string(long)},
	}
	for name, f := range cases {
		t.Run(name, func(t *testing.T) {
			anon := &mockAnonRepo{}
			_, err := newMapUseCase(anon, nil).GetMapPoints(context.Background(), f)
			if !errors.Is(err, domainerrors.ErrBadRequest) {
				t.Fatalf("want a bad request, got %v", err)
			}
			if anon.calls != 0 {
				t.Error("an invalid filter should not reach the repository")
			}
		})
	}
}

// ─── GetMapSummary ───────────────────────────────────────────────────────────

func TestGetMapSummary_CountsWhatThePointsShow(t *testing.T) {
	now := time.Now()
	old := now.AddDate(0, -2, 0)
	anon := &mockAnonRepo{rows: []*entity.MapReportRow{
		{ID: "1", IncidentTypeID: "t1", Location: entity.Location{Latitude: 1, Longitude: 1, Country: strPtr("Kenya")}, CreatedAt: now},
		{ID: "2", IncidentTypeID: "t1", Location: entity.Location{Latitude: 1, Longitude: 1, Country: strPtr("Kenya")}, CreatedAt: old},
		{ID: "3", IncidentTypeID: "t2", Location: entity.Location{Latitude: 2, Longitude: 2, Country: strPtr("Uganda")}, CreatedAt: now},
		// Unplaceable, so it isn't on the map and mustn't be counted either.
		{ID: "4", IncidentTypeID: "t2", Location: entity.Location{Country: strPtr("Atlantis")}, CreatedAt: now},
	}}
	types := []*entity.IncidentType{
		{ID: "t1", Name: "Police misconduct", Color: "#ef4444"},
		{ID: "t2", Name: "Community petitions", Color: "#00FFFF\r\n"},
	}
	s, err := newMapUseCase(anon, types).GetMapSummary(context.Background(), entity.MapFilter{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if s.TotalReports != 3 || s.RecentReports != 2 {
		t.Errorf("total/recent = %d/%d, want 3/2", s.TotalReports, s.RecentReports)
	}
	if len(s.Countries) != 2 || s.Countries[0] != (entity.MapCountryCount{Name: "Kenya", Count: 2}) {
		t.Errorf("countries should be sorted by count, got %+v", s.Countries)
	}
	if len(s.Types) != 2 || s.Types[0].Name != "Police misconduct" || s.Types[0].Count != 2 {
		t.Errorf("types should be sorted by count, got %+v", s.Types)
	}
	if s.Types[1].Color != "#00FFFF" {
		t.Errorf("type colors should be trimmed, got %q", s.Types[1].Color)
	}
}

// ─── GetMapReport ────────────────────────────────────────────────────────────

func TestGetMapReport_ReturnsPublicFieldsOnly(t *testing.T) {
	key := "evidence/secret.jpg"
	anon := &mockAnonRepo{report: &entity.AnonymousIncidentReport{
		ID: reportID, IncidentTypeID: "t1", Description: "Water cut for a week",
		Injuries: 1, Fatalities: 0, EvidenceFileKey: &key,
		Location: entity.Location{Address: strPtr("Kibera"), Country: strPtr("Kenya")},
	}}
	d, err := newMapUseCase(anon, nil).GetMapReport(context.Background(), reportID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if d.Name != "Kibera" || d.Country != "Kenya" || d.Description != "Water cut for a week" || d.Injuries != 1 {
		t.Errorf("unexpected detail %+v", d)
	}
}

func TestGetMapReport_NotFound(t *testing.T) {
	for name, id := range map[string]string{"missing": reportID, "malformed id": "not-a-uuid"} {
		t.Run(name, func(t *testing.T) {
			_, err := newMapUseCase(&mockAnonRepo{}, nil).GetMapReport(context.Background(), id)
			if !errors.Is(err, domainerrors.ErrNotFound) {
				t.Fatalf("want not found, got %v", err)
			}
		})
	}
}
