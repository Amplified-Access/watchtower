package analyticsusecase

import (
	"context"
	"errors"
	"testing"
	"time"

	"backend/internal/domain/entity"
	domainerrors "backend/internal/domain/errors"
)

type fakeReports struct {
	got   entity.AnalyticsQuery
	calls int
}

func (f *fakeReports) Aggregate(_ context.Context, q entity.AnalyticsQuery) (*entity.AnalyticsResult, error) {
	f.got, f.calls = q, f.calls+1
	return &entity.AnalyticsResult{GroupBy: q.GroupBy, Totals: entity.AnalyticsBucket{Reports: 7}}, nil
}

func (f *fakeReports) Overview(_ context.Context, limit int) (*entity.DataOverview, error) {
	f.got = entity.AnalyticsQuery{Limit: limit}
	return &entity.DataOverview{TotalReports: 7}, nil
}

// The rest of the repository interface isn't used by this usecase.
func (f *fakeReports) FindAll(context.Context, *string, *string, *time.Time) ([]*entity.AnonymousIncidentReport, error) {
	return nil, nil
}
func (f *fakeReports) FindByID(context.Context, string) (*entity.AnonymousIncidentReport, error) {
	return nil, nil
}
func (f *fakeReports) Create(context.Context, *entity.AnonymousIncidentReport) error { return nil }
func (f *fakeReports) GetHeatmapData(context.Context) ([]*entity.HeatmapPoint, error) {
	return nil, nil
}
func (f *fakeReports) GetTypeDistribution(context.Context) ([]*entity.TypeCount, error) {
	return nil, nil
}
func (f *fakeReports) FindForMap(context.Context, entity.MapFilter) ([]*entity.MapReportRow, error) {
	return nil, nil
}

func TestQuery_RejectsUnsupportedInput(t *testing.T) {
	from := time.Date(2026, 3, 1, 0, 0, 0, 0, time.UTC)
	cases := map[string]entity.AnalyticsQuery{
		"unknown grouping": {GroupBy: "incident_type_id"},
		"unknown period":   {Filter: entity.MapFilter{Period: "fortnight"}},
		"backwards range":  {Filter: entity.MapFilter{From: &from, To: &from}},
	}
	for name, q := range cases {
		t.Run(name, func(t *testing.T) {
			repo := &fakeReports{}
			_, err := New(repo).Query(context.Background(), q)
			if !errors.Is(err, domainerrors.ErrBadRequest) {
				t.Fatalf("want bad request, got %v", err)
			}
			if repo.calls != 0 {
				t.Error("an invalid query shouldn't reach the repository")
			}
		})
	}
}

func TestQuery_AppliesLimits(t *testing.T) {
	cases := map[string]struct{ in, want int }{
		"default": {0, DefaultLimit},
		"capped":  {MaxLimit + 500, MaxLimit},
		"kept":    {5, 5},
	}
	for name, tc := range cases {
		t.Run(name, func(t *testing.T) {
			repo := &fakeReports{}
			if _, err := New(repo).Query(context.Background(), entity.AnalyticsQuery{
				GroupBy: entity.GroupByCountry, Limit: tc.in,
			}); err != nil {
				t.Fatal(err)
			}
			if repo.got.Limit != tc.want {
				t.Errorf("limit = %d, want %d", repo.got.Limit, tc.want)
			}
		})
	}
}

// The result says what it counted, so an answer built from it can too.
func TestQuery_EchoesTheFilter(t *testing.T) {
	from := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	to := time.Date(2026, 2, 1, 0, 0, 0, 0, time.UTC)
	res, err := New(&fakeReports{}).Query(context.Background(), entity.AnalyticsQuery{
		GroupBy: entity.GroupByMonth,
		Filter:  entity.MapFilter{Country: "Kenya", Category: "Protests", From: &from, To: &to},
	})
	if err != nil {
		t.Fatal(err)
	}
	want := entity.AppliedFilter{Country: "Kenya", Type: "Protests", From: "2026-01-01", To: "2026-02-01"}
	if res.Applied != want {
		t.Errorf("applied = %+v, want %+v", res.Applied, want)
	}
}

func TestQuery_UnfilteredSaysAllTime(t *testing.T) {
	res, err := New(&fakeReports{}).Query(context.Background(), entity.AnalyticsQuery{})
	if err != nil {
		t.Fatal(err)
	}
	if res.Applied.Period != "all time" {
		t.Errorf("period = %q, want %q", res.Applied.Period, "all time")
	}
}
