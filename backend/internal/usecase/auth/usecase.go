package authusecase

import (
	"context"
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/argon2"

	pgRepo "backend/internal/adapter/repository/postgres"
	"backend/internal/domain/entity"
	domainerrors "backend/internal/domain/errors"
	"backend/internal/domain/repository"
	emailSvc "backend/pkg/email"
)

// Argon2id parameters (OWASP recommended: 64 MiB, 3 iterations, 4 threads).
const (
	argonMemory  uint32 = 64 * 1024
	argonTime    uint32 = 3
	argonThreads uint8  = 4
	argonKeyLen  uint32 = 32
	argonSaltLen        = 16
)

type UseCase struct {
	userRepo repository.UserRepository
	authRepo repository.AuthRepository
	email    emailSvc.Service
}

func New(userRepo repository.UserRepository, authRepo repository.AuthRepository, email emailSvc.Service) *UseCase {
	return &UseCase{userRepo: userRepo, authRepo: authRepo, email: email}
}

func (uc *UseCase) Login(ctx context.Context, email, password, ipAddr, userAgent string) (*entity.Session, *entity.User, error) {
	user, err := uc.userRepo.FindByEmail(ctx, email)
	if err != nil {
		slog.Error("login: user lookup failed", slog.String("error", err.Error()))
		return nil, nil, domainerrors.NewUnauthorized("invalid credentials")
	}
	if user == nil {
		return nil, nil, domainerrors.NewUnauthorized("invalid credentials")
	}
	if user.Banned {
		return nil, nil, domainerrors.NewForbidden("account is banned")
	}

	hash, err := uc.authRepo.GetPasswordHash(ctx, user.ID)
	if err != nil {
		slog.Error("login: password hash lookup failed", slog.String("user_id", user.ID), slog.String("error", err.Error()))
		return nil, nil, domainerrors.NewUnauthorized("invalid credentials")
	}
	if hash == "" {
		return nil, nil, domainerrors.NewUnauthorized("invalid credentials")
	}

	if err := verifyPassword(hash, password); err != nil {
		return nil, nil, domainerrors.NewUnauthorized("invalid credentials")
	}

	session, err := pgRepo.NewSession(user.ID, ipAddr, userAgent)
	if err != nil {
		return nil, nil, fmt.Errorf("create session: %w", err)
	}
	if err := uc.authRepo.CreateSession(ctx, session); err != nil {
		return nil, nil, fmt.Errorf("persist session: %w", err)
	}

	return session, user, nil
}

func (uc *UseCase) Register(ctx context.Context, email, password, name, ipAddr, userAgent string) (*entity.Session, *entity.User, error) {
	existing, err := uc.userRepo.FindByEmail(ctx, email)
	if err != nil {
		slog.Error("register: user lookup failed", slog.String("error", err.Error()))
		return nil, nil, fmt.Errorf("lookup user: %w", err)
	}
	if existing != nil {
		return nil, nil, domainerrors.NewConflict("email already in use")
	}

	hash, err := hashPassword(password)
	if err != nil {
		return nil, nil, fmt.Errorf("hash password: %w", err)
	}

	user := &entity.User{
		ID:    uuid.New().String(),
		Name:  name,
		Email: email,
	}
	if err := uc.authRepo.CreateUser(ctx, user); err != nil {
		return nil, nil, fmt.Errorf("create user: %w", err)
	}
	if err := uc.authRepo.CreatePasswordCredential(ctx, user.ID, hash); err != nil {
		return nil, nil, fmt.Errorf("create credential: %w", err)
	}

	session, err := pgRepo.NewSession(user.ID, ipAddr, userAgent)
	if err != nil {
		return nil, nil, fmt.Errorf("create session: %w", err)
	}
	if err := uc.authRepo.CreateSession(ctx, session); err != nil {
		return nil, nil, fmt.Errorf("persist session: %w", err)
	}

	return session, user, nil
}

func (uc *UseCase) Logout(ctx context.Context, token string) error {
	return uc.authRepo.DeleteSession(ctx, token)
}

func (uc *UseCase) ForgotPassword(ctx context.Context, email, frontendURL string) error {
	user, err := uc.userRepo.FindByEmail(ctx, email)
	if err != nil {
		// Infrastructure error — log it, but don't reveal it to the caller.
		slog.Error("forgot-password: user lookup failed", slog.String("error", err.Error()))
		return nil
	}
	if user == nil {
		return nil
	}

	token, err := pgRepo.GenerateSessionToken()
	if err != nil {
		return fmt.Errorf("generate token: %w", err)
	}

	expiresAt := time.Now().Add(time.Hour)
	if err := uc.authRepo.CreatePasswordResetToken(ctx, email, token, expiresAt); err != nil {
		return fmt.Errorf("store reset token: %w", err)
	}

	resetURL := fmt.Sprintf("%s/reset-password?token=%s", frontendURL, token)
	subject := "Reset your WatchTower password"
	text := fmt.Sprintf("Click the link below to reset your password:\n\n%s\n\nThis link expires in 1 hour.", resetURL)
	html := fmt.Sprintf(
		`<p>Click the link below to reset your password:</p><p><a href="%s">Reset password</a></p><p>This link expires in 1 hour.</p>`,
		resetURL,
	)
	if err := uc.email.Send(email, subject, text, &html); err != nil {
		return fmt.Errorf("send reset email: %w", err)
	}
	return nil
}

func (uc *UseCase) ResetPassword(ctx context.Context, token, newPassword string) error {
	email, expiresAt, err := uc.authRepo.GetPasswordResetToken(ctx, token)
	if err != nil {
		return domainerrors.NewUnauthorized("invalid reset token")
	}
	if email == "" {
		return domainerrors.NewUnauthorized("invalid reset token")
	}
	if time.Now().After(expiresAt) {
		_ = uc.authRepo.DeletePasswordResetToken(ctx, token)
		return domainerrors.NewUnauthorized("reset token has expired")
	}

	hash, err := hashPassword(newPassword)
	if err != nil {
		return fmt.Errorf("hash password: %w", err)
	}

	if err := uc.authRepo.UpdatePasswordHash(ctx, email, hash); err != nil {
		return fmt.Errorf("update password: %w", err)
	}

	return uc.authRepo.DeletePasswordResetToken(ctx, token)
}

// hashPassword returns an Argon2id PHC string.
func hashPassword(password string) (string, error) {
	salt := make([]byte, argonSaltLen)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}
	key := argon2.IDKey([]byte(password), salt, argonTime, argonMemory, argonThreads, argonKeyLen)
	return fmt.Sprintf("$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
		argon2.Version,
		argonMemory, argonTime, argonThreads,
		base64.RawStdEncoding.EncodeToString(salt),
		base64.RawStdEncoding.EncodeToString(key),
	), nil
}

// verifyPassword supports Argon2id (new) hashes only.
// All pre-migration passwords must be reset via forgot-password.
func verifyPassword(hash, password string) error {
	if !strings.HasPrefix(hash, "$argon2id$") {
		return fmt.Errorf("unsupported hash format — password reset required")
	}

	// Parse PHC string: $argon2id$v=<v>$m=<m>,t=<t>,p=<p>$<salt>$<key>
	// Format: ["", "argon2id", "v=19", "m=...,t=...,p=...", "<salt>", "<key>"]
	parts := strings.Split(hash, "$")
	if len(parts) != 6 {
		return fmt.Errorf("malformed argon2id hash")
	}

	var m, t uint32
	var p uint8
	if _, err := fmt.Sscanf(parts[3], "m=%d,t=%d,p=%d", &m, &t, &p); err != nil {
		return fmt.Errorf("malformed argon2id params")
	}

	salt, err := base64.RawStdEncoding.DecodeString(parts[4])
	if err != nil {
		return fmt.Errorf("invalid salt")
	}
	storedKey, err := base64.RawStdEncoding.DecodeString(parts[5])
	if err != nil {
		return fmt.Errorf("invalid key")
	}

	derived := argon2.IDKey([]byte(password), salt, t, m, p, uint32(len(storedKey)))
	if subtle.ConstantTimeCompare(derived, storedKey) != 1 {
		return fmt.Errorf("password mismatch")
	}
	return nil
}
