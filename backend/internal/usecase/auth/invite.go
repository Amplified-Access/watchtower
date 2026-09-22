package authusecase

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"html"
	"strings"
	"time"

	"github.com/google/uuid"

	pgRepo "backend/internal/adapter/repository/postgres"
	"backend/internal/domain/entity"
	domainerrors "backend/internal/domain/errors"
)

// inviteLinkTTL is longer than a password reset's hour: invitees often don't
// open the email straight away.
const inviteLinkTTL = 72 * time.Hour

// InviteUser creates an account in the inviter's organization and emails a
// link to set its password. Admins can invite watchers and independent
// reporters; only a super-admin can hand out the admin roles.
func (uc *UseCase) InviteUser(ctx context.Context, inviter *entity.User, name, email string, role entity.UserRole, frontendURL string) (*entity.User, error) {
	if inviter == nil || inviter.OrganizationID == nil {
		return nil, domainerrors.NewForbidden("organization membership required")
	}
	name = strings.TrimSpace(name)
	email = strings.ToLower(strings.TrimSpace(email))
	if name == "" || email == "" {
		return nil, domainerrors.NewBadRequest("name and email are required")
	}
	if role == "" {
		role = entity.RoleWatcher
	}
	switch role {
	case entity.RoleWatcher, entity.RoleIndependentReporter:
	case entity.RoleAdmin, entity.RoleSuperAdmin:
		if inviter.Role != entity.RoleSuperAdmin {
			return nil, domainerrors.NewForbidden("only a super-admin can invite admins")
		}
	default:
		return nil, domainerrors.NewBadRequest("unknown role: " + string(role))
	}

	existing, err := uc.userRepo.FindByEmail(ctx, email)
	if err != nil {
		return nil, fmt.Errorf("lookup user: %w", err)
	}
	if existing != nil {
		return nil, domainerrors.NewConflict("email already in use")
	}

	// The account gets a random password nobody knows, so it can't be signed
	// into until the invitee sets their own through the emailed link.
	secret := make([]byte, 32)
	if _, err := rand.Read(secret); err != nil {
		return nil, fmt.Errorf("generate password: %w", err)
	}
	hash, err := hashPassword(base64.RawURLEncoding.EncodeToString(secret))
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	orgID := *inviter.OrganizationID
	user := &entity.User{
		ID:             uuid.New().String(),
		Name:           name,
		Email:          email,
		Role:           role,
		OrganizationID: &orgID,
	}
	if err := uc.authRepo.CreateUser(ctx, user); err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}
	if err := uc.authRepo.CreatePasswordCredential(ctx, user.ID, hash); err != nil {
		return nil, fmt.Errorf("create credential: %w", err)
	}

	token, err := pgRepo.GenerateSessionToken()
	if err != nil {
		return nil, fmt.Errorf("generate token: %w", err)
	}
	if err := uc.authRepo.CreatePasswordResetToken(ctx, email, token, time.Now().Add(inviteLinkTTL)); err != nil {
		return nil, fmt.Errorf("store invite token: %w", err)
	}

	link := fmt.Sprintf("%s/reset-password?token=%s&invite=1", frontendURL, token)
	subject := "You've been invited to WatchTower"
	text := fmt.Sprintf(
		"Hi %s,\n\n%s has invited you to WatchTower. Set your password to get started:\n\n%s\n\nThis link expires in 3 days.",
		name, inviter.Name, link,
	)
	body := fmt.Sprintf(
		`<p>Hi %s,</p><p>%s has invited you to WatchTower. Set your password to get started:</p><p><a href="%s">Set your password</a></p><p>This link expires in 3 days.</p>`,
		html.EscapeString(name), html.EscapeString(inviter.Name), link,
	)
	if err := uc.email.Send(email, subject, text, &body); err != nil {
		// The account exists; an admin can resend with forgot-password.
		return nil, fmt.Errorf("send invite email: %w", err)
	}
	return user, nil
}
