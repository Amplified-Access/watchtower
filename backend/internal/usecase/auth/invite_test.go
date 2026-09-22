package authusecase

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"backend/internal/domain/entity"
	domainerrors "backend/internal/domain/errors"
	"backend/internal/domain/repository"
)

type mockUserRepo struct {
	repository.UserRepository
	existing *entity.User
}

func (m *mockUserRepo) FindByEmail(_ context.Context, _ string) (*entity.User, error) {
	return m.existing, nil
}

type mockAuthRepo struct {
	repository.AuthRepository
	created     *entity.User
	credential  string
	tokenEmail  string
	tokenExpiry time.Time
}

func (m *mockAuthRepo) CreateUser(_ context.Context, u *entity.User) error {
	m.created = u
	return nil
}
func (m *mockAuthRepo) CreatePasswordCredential(_ context.Context, _ string, hash string) error {
	m.credential = hash
	return nil
}
func (m *mockAuthRepo) CreatePasswordResetToken(_ context.Context, email, _ string, expiresAt time.Time) error {
	m.tokenEmail, m.tokenExpiry = email, expiresAt
	return nil
}

type mockEmail struct {
	to, subject, text string
	html              *string
}

func (m *mockEmail) Send(to, subject, text string, html *string) error {
	m.to, m.subject, m.text, m.html = to, subject, text, html
	return nil
}

func strPtr(s string) *string { return &s }

func admin(role entity.UserRole) *entity.User {
	return &entity.User{ID: "admin-1", Name: "Ada <Admin>", Role: role, OrganizationID: strPtr("org-1")}
}

func TestInviteUser_CreatesWatcherInInvitersOrg(t *testing.T) {
	auth, mail := &mockAuthRepo{}, &mockEmail{}
	uc := New(&mockUserRepo{}, auth, mail)

	user, err := uc.InviteUser(context.Background(), admin(entity.RoleAdmin), " Wanjiru ", " Wanjiru@Example.org ", "", "https://app.test")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if user.Role != entity.RoleWatcher || user.OrganizationID == nil || *user.OrganizationID != "org-1" {
		t.Errorf("want a watcher in org-1, got role %q org %v", user.Role, user.OrganizationID)
	}
	if user.Email != "wanjiru@example.org" || user.Name != "Wanjiru" {
		t.Errorf("email and name should be normalised, got %q %q", user.Email, user.Name)
	}
	if auth.created != user || !strings.HasPrefix(auth.credential, "$argon2id$") {
		t.Error("the account and an argon2id credential should be stored")
	}
	if auth.tokenEmail != user.Email || time.Until(auth.tokenExpiry) < 71*time.Hour {
		t.Errorf("want a ~72h invite token for the invitee, got %q expiring %v", auth.tokenEmail, auth.tokenExpiry)
	}
	if mail.to != user.Email || !strings.Contains(mail.text, "https://app.test/reset-password?token=") {
		t.Errorf("invite email should link to the reset page, got to=%q text=%q", mail.to, mail.text)
	}
	if mail.html == nil || strings.Contains(*mail.html, "<Admin>") {
		t.Error("the inviter's name must be HTML-escaped in the email")
	}
}

func TestInviteUser_Rejections(t *testing.T) {
	cases := []struct {
		name     string
		inviter  *entity.User
		role     entity.UserRole
		existing *entity.User
		want     error
	}{
		{"admin cannot invite admins", admin(entity.RoleAdmin), entity.RoleAdmin, nil, domainerrors.ErrForbidden},
		{"admin cannot invite super-admins", admin(entity.RoleAdmin), entity.RoleSuperAdmin, nil, domainerrors.ErrForbidden},
		{"unknown role", admin(entity.RoleSuperAdmin), "owner", nil, domainerrors.ErrBadRequest},
		{"no organization", &entity.User{Role: entity.RoleAdmin}, entity.RoleWatcher, nil, domainerrors.ErrForbidden},
		{"email taken", admin(entity.RoleAdmin), entity.RoleWatcher, &entity.User{ID: "x"}, domainerrors.ErrConflict},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			auth, mail := &mockAuthRepo{}, &mockEmail{}
			uc := New(&mockUserRepo{existing: tc.existing}, auth, mail)
			_, err := uc.InviteUser(context.Background(), tc.inviter, "Name", "a@b.org", tc.role, "https://app.test")
			if !errors.Is(err, tc.want) {
				t.Fatalf("want %v, got %v", tc.want, err)
			}
			if auth.created != nil || mail.to != "" {
				t.Error("a rejected invite must not create an account or send email")
			}
		})
	}
}

func TestInviteUser_SuperAdminCanInviteAdmins(t *testing.T) {
	uc := New(&mockUserRepo{}, &mockAuthRepo{}, &mockEmail{})
	user, err := uc.InviteUser(context.Background(), admin(entity.RoleSuperAdmin), "Name", "a@b.org", entity.RoleAdmin, "https://app.test")
	if err != nil || user.Role != entity.RoleAdmin {
		t.Fatalf("want an admin, got %v / %v", user, err)
	}
}
