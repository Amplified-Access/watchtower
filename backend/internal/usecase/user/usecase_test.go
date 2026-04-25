package userusecase

import (
	"context"
	"errors"
	"testing"

	"backend/internal/domain/entity"
	domainerrors "backend/internal/domain/errors"
)

// ─── Mocks ───────────────────────────────────────────────────────────────────

type mockSessionRepo struct {
	user *entity.User
	err  error
}

func (m *mockSessionRepo) FindByToken(_ context.Context, _ string) (*entity.Session, error) {
	return nil, nil
}

func (m *mockSessionRepo) FindUserByToken(_ context.Context, _ string) (*entity.User, error) {
	return m.user, m.err
}

type mockUserRepo struct {
	user         *entity.User
	users        []*entity.User
	err          error
	capturedRole *entity.UserRole
}

func (m *mockUserRepo) FindByID(_ context.Context, _ string) (*entity.User, error) {
	return m.user, m.err
}

func (m *mockUserRepo) FindByEmail(_ context.Context, _ string) (*entity.User, error) {
	return m.user, m.err
}

func (m *mockUserRepo) FindAll(_ context.Context, role *entity.UserRole) ([]*entity.User, error) {
	m.capturedRole = role
	return m.users, m.err
}

func (m *mockUserRepo) Update(_ context.Context, _ *entity.User) error { return m.err }
func (m *mockUserRepo) Delete(_ context.Context, _ string) error       { return m.err }

// ─── GetCurrentUser ──────────────────────────────────────────────────────────

func TestGetCurrentUser_Success(t *testing.T) {
	user := &entity.User{ID: "u1", Email: "test@example.com", Banned: false}
	uc := New(&mockUserRepo{}, &mockSessionRepo{user: user})

	got, err := uc.GetCurrentUser(context.Background(), "valid-token")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got.ID != user.ID {
		t.Errorf("user.ID = %q, want %q", got.ID, user.ID)
	}
}

func TestGetCurrentUser_SessionRepoError_ReturnsUnauthorized(t *testing.T) {
	uc := New(&mockUserRepo{}, &mockSessionRepo{err: errors.New("db error")})

	_, err := uc.GetCurrentUser(context.Background(), "bad-token")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, domainerrors.ErrUnauthorized) {
		t.Errorf("error = %v, want ErrUnauthorized", err)
	}
}

func TestGetCurrentUser_NilUser_ReturnsUnauthorized(t *testing.T) {
	uc := New(&mockUserRepo{}, &mockSessionRepo{user: nil})

	_, err := uc.GetCurrentUser(context.Background(), "ghost-token")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, domainerrors.ErrUnauthorized) {
		t.Errorf("error = %v, want ErrUnauthorized", err)
	}
}

func TestGetCurrentUser_BannedUser_ReturnsForbidden(t *testing.T) {
	banned := &entity.User{ID: "u2", Banned: true}
	uc := New(&mockUserRepo{}, &mockSessionRepo{user: banned})

	_, err := uc.GetCurrentUser(context.Background(), "banned-token")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, domainerrors.ErrForbidden) {
		t.Errorf("error = %v, want ErrForbidden", err)
	}
}

// ─── GetByID ─────────────────────────────────────────────────────────────────

func TestGetByID_Found(t *testing.T) {
	user := &entity.User{ID: "u3", Email: "user@example.com"}
	uc := New(&mockUserRepo{user: user}, &mockSessionRepo{})

	got, err := uc.GetByID(context.Background(), "u3")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got.ID != "u3" {
		t.Errorf("got ID %q, want %q", got.ID, "u3")
	}
}

func TestGetByID_NilUser_ReturnsNotFound(t *testing.T) {
	uc := New(&mockUserRepo{user: nil}, &mockSessionRepo{})

	_, err := uc.GetByID(context.Background(), "missing")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, domainerrors.ErrNotFound) {
		t.Errorf("error = %v, want ErrNotFound", err)
	}
}

func TestGetByID_RepoError_Propagates(t *testing.T) {
	repoErr := errors.New("connection reset")
	uc := New(&mockUserRepo{err: repoErr}, &mockSessionRepo{})

	_, err := uc.GetByID(context.Background(), "u3")
	if !errors.Is(err, repoErr) {
		t.Errorf("error = %v, want %v", err, repoErr)
	}
}

// ─── GetAllByRole ─────────────────────────────────────────────────────────────

func TestGetAllByRole_PassesRoleToRepo(t *testing.T) {
	repo := &mockUserRepo{users: []*entity.User{{ID: "u1"}}}
	uc := New(repo, &mockSessionRepo{})

	_, err := uc.GetAllByRole(context.Background(), entity.RoleAdmin)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if repo.capturedRole == nil || *repo.capturedRole != entity.RoleAdmin {
		t.Errorf("capturedRole = %v, want %v", repo.capturedRole, entity.RoleAdmin)
	}
}
