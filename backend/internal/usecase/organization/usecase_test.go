package organizationusecase

import (
	"context"
	"errors"
	"testing"

	"backend/internal/domain/entity"
	domainerrors "backend/internal/domain/errors"
)

// ─── Mocks ───────────────────────────────────────────────────────────────────

type mockOrgRepo struct {
	org   *entity.Organization
	orgs  []*entity.Organization
	total int
	err   error
}

func (m *mockOrgRepo) FindAll(_ context.Context, _ entity.ListParams) ([]*entity.Organization, int, error) {
	return m.orgs, m.total, m.err
}
func (m *mockOrgRepo) FindByID(_ context.Context, _ string) (*entity.Organization, error) {
	return m.org, m.err
}
func (m *mockOrgRepo) FindBySlug(_ context.Context, _ string) (*entity.Organization, error) {
	return m.org, m.err
}
func (m *mockOrgRepo) Create(_ context.Context, _ *entity.Organization) error { return m.err }
func (m *mockOrgRepo) Update(_ context.Context, _ *entity.Organization) error { return m.err }

type mockAppRepo struct {
	app            *entity.OrganizationApplication
	apps           []*entity.OrganizationApplication
	err            error
	capturedStatus entity.ApplicationStatus
	capturedID     int
}

func (m *mockAppRepo) FindAll(_ context.Context) ([]*entity.OrganizationApplication, error) {
	return m.apps, m.err
}
func (m *mockAppRepo) FindByID(_ context.Context, _ int) (*entity.OrganizationApplication, error) {
	return m.app, m.err
}
func (m *mockAppRepo) Create(_ context.Context, _ *entity.OrganizationApplication) error {
	return m.err
}
func (m *mockAppRepo) UpdateStatus(_ context.Context, id int, status entity.ApplicationStatus) error {
	m.capturedID = id
	m.capturedStatus = status
	return m.err
}

// ─── GetBySlug ───────────────────────────────────────────────────────────────

func TestGetBySlug_Found(t *testing.T) {
	org := &entity.Organization{ID: "org1", Slug: "test-org"}
	uc := New(&mockOrgRepo{org: org}, &mockAppRepo{})

	got, err := uc.GetBySlug(context.Background(), "test-org")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got.Slug != "test-org" {
		t.Errorf("slug = %q, want %q", got.Slug, "test-org")
	}
}

func TestGetBySlug_NilOrg_ReturnsNotFound(t *testing.T) {
	uc := New(&mockOrgRepo{org: nil}, &mockAppRepo{})

	_, err := uc.GetBySlug(context.Background(), "missing")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, domainerrors.ErrNotFound) {
		t.Errorf("error = %v, want ErrNotFound", err)
	}
}

func TestGetBySlug_RepoError_Propagates(t *testing.T) {
	repoErr := errors.New("db error")
	uc := New(&mockOrgRepo{err: repoErr}, &mockAppRepo{})

	_, err := uc.GetBySlug(context.Background(), "org1")
	if !errors.Is(err, repoErr) {
		t.Errorf("error = %v, want %v", err, repoErr)
	}
}

// ─── ApproveApplication ──────────────────────────────────────────────────────

func TestApproveApplication_Success(t *testing.T) {
	app := &entity.OrganizationApplication{ID: 1, Status: entity.ApplicationPending}
	appRepo := &mockAppRepo{app: app}
	uc := New(&mockOrgRepo{}, appRepo)

	if err := uc.ApproveApplication(context.Background(), 1); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if appRepo.capturedStatus != entity.ApplicationApproved {
		t.Errorf("status = %q, want %q", appRepo.capturedStatus, entity.ApplicationApproved)
	}
	if appRepo.capturedID != 1 {
		t.Errorf("capturedID = %d, want 1", appRepo.capturedID)
	}
}

func TestApproveApplication_NotFound(t *testing.T) {
	uc := New(&mockOrgRepo{}, &mockAppRepo{app: nil})

	err := uc.ApproveApplication(context.Background(), 99)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, domainerrors.ErrNotFound) {
		t.Errorf("error = %v, want ErrNotFound", err)
	}
}

func TestApproveApplication_AlreadyApproved_ReturnsBadRequest(t *testing.T) {
	app := &entity.OrganizationApplication{ID: 2, Status: entity.ApplicationApproved}
	uc := New(&mockOrgRepo{}, &mockAppRepo{app: app})

	err := uc.ApproveApplication(context.Background(), 2)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, domainerrors.ErrBadRequest) {
		t.Errorf("error = %v, want ErrBadRequest", err)
	}
}

func TestApproveApplication_AlreadyDeclined_ReturnsBadRequest(t *testing.T) {
	app := &entity.OrganizationApplication{ID: 3, Status: entity.ApplicationDeclined}
	uc := New(&mockOrgRepo{}, &mockAppRepo{app: app})

	err := uc.ApproveApplication(context.Background(), 3)
	if !errors.Is(err, domainerrors.ErrBadRequest) {
		t.Errorf("error = %v, want ErrBadRequest", err)
	}
}

// ─── DeclineApplication ──────────────────────────────────────────────────────

func TestDeclineApplication_Success(t *testing.T) {
	app := &entity.OrganizationApplication{ID: 4, Status: entity.ApplicationPending}
	appRepo := &mockAppRepo{app: app}
	uc := New(&mockOrgRepo{}, appRepo)

	if err := uc.DeclineApplication(context.Background(), 4); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if appRepo.capturedStatus != entity.ApplicationDeclined {
		t.Errorf("status = %q, want %q", appRepo.capturedStatus, entity.ApplicationDeclined)
	}
}

func TestDeclineApplication_NotFound(t *testing.T) {
	uc := New(&mockOrgRepo{}, &mockAppRepo{app: nil})

	err := uc.DeclineApplication(context.Background(), 99)
	if !errors.Is(err, domainerrors.ErrNotFound) {
		t.Errorf("error = %v, want ErrNotFound", err)
	}
}

// ─── GetAll ───────────────────────────────────────────────────────────────────

func TestGetAll_ReturnsOrgsAndTotal(t *testing.T) {
	orgs := []*entity.Organization{{ID: "o1"}, {ID: "o2"}}
	uc := New(&mockOrgRepo{orgs: orgs, total: 2}, &mockAppRepo{})

	got, total, err := uc.GetAll(context.Background(), entity.ListParams{Limit: 10})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(got) != 2 {
		t.Errorf("len = %d, want 2", len(got))
	}
	if total != 2 {
		t.Errorf("total = %d, want 2", total)
	}
}

// ─── SubmitApplication ────────────────────────────────────────────────────────

func TestSubmitApplication_CallsCreate(t *testing.T) {
	appRepo := &mockAppRepo{}
	uc := New(&mockOrgRepo{}, appRepo)
	app := &entity.OrganizationApplication{OrganizationName: "ACME", ApplicantEmail: "a@b.com"}

	if err := uc.SubmitApplication(context.Background(), app); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}
