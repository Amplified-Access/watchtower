package deploymentusecase

import (
	"context"
	"errors"
	"testing"
	"time"

	"backend/internal/domain/entity"
	domainerrors "backend/internal/domain/errors"
)

type mockRepo struct {
	found      *entity.Deployment
	updated    entity.DeploymentStatus
	taken      map[string]bool
	created    *entity.Deployment
	createdIDs []string
	listedOrg  *string
}

func (m *mockRepo) FindAll(_ context.Context, orgID *string) ([]*entity.Deployment, error) {
	m.listedOrg = orgID
	return nil, nil
}
func (m *mockRepo) CountByStatus(_ context.Context, _ *string) (entity.DeploymentCounts, error) {
	return entity.DeploymentCounts{}, nil
}
func (m *mockRepo) FindBySlug(_ context.Context, _ string) (*entity.Deployment, error) {
	return m.found, nil
}
func (m *mockRepo) FindByID(_ context.Context, _ string) (*entity.Deployment, error) {
	return m.found, nil
}
func (m *mockRepo) UpdateStatus(_ context.Context, _ string, s entity.DeploymentStatus) error {
	m.updated = s
	return nil
}
func (m *mockRepo) CountReports(_ context.Context, _ string, since *time.Time) (int, error) {
	if since == nil {
		return 10, nil
	}
	if since.Day() == 1 && since.Month() == time.Now().Month() {
		return 4, nil // this month
	}
	return 7, nil // since last month's start
}
func (m *mockRepo) ReportsByType(_ context.Context, _ string) ([]*entity.TypeCount, error) {
	return nil, nil
}
func (m *mockRepo) WeeklyReports(_ context.Context, _ string) ([]*entity.WeeklyTrendPoint, error) {
	return nil, nil
}
func (m *mockRepo) MostActive(_ context.Context, _ time.Time, _ int) ([]*entity.DeploymentActivity, error) {
	return nil, nil
}
func (m *mockRepo) SlugExists(_ context.Context, slug string) (bool, error) {
	return m.taken[slug], nil
}
func (m *mockRepo) Create(_ context.Context, d *entity.Deployment, ids []string) error {
	m.created, m.createdIDs = d, ids
	return nil
}

func valid() entity.NewDeployment {
	return entity.NewDeployment{Name: "Uganda 2026 Elections", IncidentTypeIDs: []string{"t1"}}
}

func isBadRequest(err error) bool { return errors.Is(err, domainerrors.ErrBadRequest) }

func TestSlugify(t *testing.T) {
	cases := map[string]string{
		"Uganda 2026 Elections!":   "uganda-2026-elections",
		"  Water -- access  ":      "water-access",
		"Élections présidentielles": "elections-presidentielles",
		"!!!":                      "",
	}
	for in, want := range cases {
		if got := Slugify(in); got != want {
			t.Errorf("Slugify(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestCreate_Defaults(t *testing.T) {
	repo := &mockRepo{taken: map[string]bool{}}
	desc := "  "
	in := valid()
	in.Description = &desc
	in.IncidentTypeIDs = []string{"t1", " t1 ", "", "t2"}

	d, err := New(repo).Create(context.Background(), "org-1", in)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if d.Slug != "uganda-2026-elections" || d.Status != entity.DeploymentDraft || d.OrganizationID != "org-1" {
		t.Errorf("got slug %q status %q org %q", d.Slug, d.Status, d.OrganizationID)
	}
	if d.Description != nil {
		t.Errorf("blank description should be nil, got %q", *d.Description)
	}
	if len(repo.createdIDs) != 2 {
		t.Errorf("incident types should be trimmed and de-duplicated, got %v", repo.createdIDs)
	}
}

func TestCreate_SlugSuffix(t *testing.T) {
	repo := &mockRepo{taken: map[string]bool{"uganda-2026-elections": true, "uganda-2026-elections-2": true}}
	d, err := New(repo).Create(context.Background(), "org-1", valid())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if d.Slug != "uganda-2026-elections-3" {
		t.Errorf("slug = %q, want uganda-2026-elections-3", d.Slug)
	}
}

func TestCreate_Rejects(t *testing.T) {
	start := time.Date(2026, 1, 10, 0, 0, 0, 0, time.UTC)
	end := start.Add(-24 * time.Hour)
	cases := map[string]func(*entity.NewDeployment){
		"no name":           func(in *entity.NewDeployment) { in.Name = "   " },
		"no incident types": func(in *entity.NewDeployment) { in.IncidentTypeIDs = []string{" "} },
		"bad status":        func(in *entity.NewDeployment) { in.Status = "archived" },
		"end before start":  func(in *entity.NewDeployment) { in.StartsAt, in.EndsAt = &start, &end },
	}
	for name, mutate := range cases {
		in := valid()
		mutate(&in)
		repo := &mockRepo{taken: map[string]bool{}}
		if _, err := New(repo).Create(context.Background(), "org-1", in); !isBadRequest(err) {
			t.Errorf("%s: want bad request, got %v", name, err)
		}
		if repo.created != nil {
			t.Errorf("%s: nothing should be saved", name)
		}
	}
}

func TestListForOrganization_Scopes(t *testing.T) {
	repo := &mockRepo{}
	_, _ = New(repo).ListForOrganization(context.Background(), "org-1")
	if repo.listedOrg == nil || *repo.listedOrg != "org-1" {
		t.Errorf("an admin's list must be scoped to their organization, got %v", repo.listedOrg)
	}
}

func isNotFound(err error) bool { return errors.Is(err, domainerrors.ErrNotFound) }

func TestGetPublic_HidesDrafts(t *testing.T) {
	for status, wantFound := range map[entity.DeploymentStatus]bool{
		entity.DeploymentDraft:  false,
		entity.DeploymentLive:   true,
		entity.DeploymentClosed: true,
	} {
		repo := &mockRepo{found: &entity.Deployment{Status: status}}
		_, err := New(repo).GetPublic(context.Background(), "x")
		if wantFound && err != nil {
			t.Errorf("%s: want found, got %v", status, err)
		}
		if !wantFound && !isNotFound(err) {
			t.Errorf("%s: want not found, got %v", status, err)
		}
	}
}

func TestUpdateStatus_OnlyOwnOrganization(t *testing.T) {
	repo := &mockRepo{found: &entity.Deployment{OrganizationID: "org-2", Status: entity.DeploymentDraft}}
	if _, err := New(repo).UpdateStatus(context.Background(), "org-1", "d1", entity.DeploymentLive); !isNotFound(err) {
		t.Errorf("another organization's deployment: want not found, got %v", err)
	}
	if repo.updated != "" {
		t.Error("nothing should be updated")
	}

	repo.found.OrganizationID = "org-1"
	d, err := New(repo).UpdateStatus(context.Background(), "org-1", "d1", entity.DeploymentLive)
	if err != nil || d.Status != entity.DeploymentLive || repo.updated != entity.DeploymentLive {
		t.Errorf("own deployment: got %v, %v", d, err)
	}
	if _, err := New(repo).UpdateStatus(context.Background(), "org-1", "d1", "archived"); !isBadRequest(err) {
		t.Errorf("bad status: want bad request, got %v", err)
	}
}

func TestAcceptsReports(t *testing.T) {
	day := func(d int) *time.Time { t := time.Date(2026, 10, d, 0, 0, 0, 0, time.UTC); return &t }
	noon := func(d int) time.Time { return time.Date(2026, 10, d, 12, 0, 0, 0, time.UTC) }
	cases := []struct {
		name string
		d    entity.Deployment
		at   time.Time
		want bool
	}{
		{"draft", entity.Deployment{Status: entity.DeploymentDraft}, noon(10), false},
		{"closed", entity.Deployment{Status: entity.DeploymentClosed}, noon(10), false},
		{"live, no dates", entity.Deployment{Status: entity.DeploymentLive}, noon(10), true},
		{"before start", entity.Deployment{Status: entity.DeploymentLive, StartsAt: day(11)}, noon(10), false},
		{"on start day", entity.Deployment{Status: entity.DeploymentLive, StartsAt: day(10)}, noon(10), true},
		{"on end day", entity.Deployment{Status: entity.DeploymentLive, EndsAt: day(10)}, noon(10), true},
		{"after end day", entity.Deployment{Status: entity.DeploymentLive, EndsAt: day(10)}, noon(11), false},
	}
	for _, c := range cases {
		if got := c.d.AcceptsReports(c.at); got != c.want {
			t.Errorf("%s: AcceptsReports = %v, want %v", c.name, got, c.want)
		}
	}
}

func TestStatsForOrganization_LastMonthExcludesThisMonth(t *testing.T) {
	stats, err := New(&mockRepo{}).StatsForOrganization(context.Background(), "org-1")
	if err != nil {
		t.Fatal(err)
	}
	if stats.TotalReports != 10 || stats.Reports.Current != 4 || stats.Reports.Previous != 3 {
		t.Errorf("got total %d, this month %d, last month %d; want 10, 4, 3",
			stats.TotalReports, stats.Reports.Current, stats.Reports.Previous)
	}
}
