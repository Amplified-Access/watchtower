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
	taken      map[string]bool
	created    *entity.Deployment
	createdIDs []string
	listedOrg  *string
}

func (m *mockRepo) FindAll(_ context.Context, orgID *string) ([]*entity.Deployment, error) {
	m.listedOrg = orgID
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
