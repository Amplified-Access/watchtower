package postgres

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"time"

	"github.com/google/uuid"

	"backend/internal/domain/entity"
)

type AuthRepository struct {
	db *sql.DB
}

func NewAuthRepository(db *sql.DB) *AuthRepository {
	return &AuthRepository{db: db}
}

func (r *AuthRepository) CreateUser(ctx context.Context, user *entity.User) error {
	const q = `
		INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at, role)
		VALUES ($1, $2, $3, false, NOW(), NOW(), '')`
	_, err := r.db.ExecContext(ctx, q, user.ID, user.Name, user.Email)
	return err
}


func (r *AuthRepository) CreateSession(ctx context.Context, session *entity.Session) error {
	const q = `
		INSERT INTO session (id, expires_at, token, created_at, updated_at, ip_address, user_agent, user_id)
		VALUES ($1, $2, $3, NOW(), NOW(), $4, $5, $6)`
	_, err := r.db.ExecContext(ctx, q,
		session.ID, session.ExpiresAt, session.Token,
		session.IPAddress, session.UserAgent, session.UserID,
	)
	return err
}

func (r *AuthRepository) DeleteSession(ctx context.Context, token string) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM session WHERE token=$1`, token)
	return err
}

func (r *AuthRepository) GetPasswordHash(ctx context.Context, userID string) (string, error) {
	var hash string
	err := r.db.QueryRowContext(ctx,
		`SELECT password FROM account WHERE user_id=$1 AND provider_id='credential' AND password IS NOT NULL`,
		userID,
	).Scan(&hash)
	if err == sql.ErrNoRows {
		return "", nil
	}
	return hash, err
}


func (r *AuthRepository) CreatePasswordCredential(ctx context.Context, userID, hashedPassword string) error {
	// Look up the user's email to use as accountId (Better Auth convention)
	var email string
	if err := r.db.QueryRowContext(ctx, `SELECT email FROM "user" WHERE id=$1`, userID).Scan(&email); err != nil {
		return err
	}

	const q = `
		INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
		VALUES ($1, $2, 'credential', $3, $4, NOW(), NOW())`
	_, err := r.db.ExecContext(ctx, q, uuid.New().String(), email, userID, hashedPassword)
	return err
}

func (r *AuthRepository) CreatePasswordResetToken(ctx context.Context, email, token string, expiresAt time.Time) error {
	// Remove any existing token for this email first to avoid stale tokens
	_, _ = r.db.ExecContext(ctx, `DELETE FROM verification WHERE identifier=$1`, email)

	const q = `
		INSERT INTO verification (id, identifier, value, expires_at, created_at, updated_at)
		VALUES ($1, $2, $3, $4, NOW(), NOW())`
	_, err := r.db.ExecContext(ctx, q, uuid.New().String(), email, token, expiresAt)
	return err
}

func (r *AuthRepository) GetPasswordResetToken(ctx context.Context, token string) (string, time.Time, error) {
	var email string
	var expiresAt time.Time
	err := r.db.QueryRowContext(ctx,
		`SELECT identifier, expires_at FROM verification WHERE value=$1`,
		token,
	).Scan(&email, &expiresAt)
	if err == sql.ErrNoRows {
		return "", time.Time{}, nil
	}
	return email, expiresAt, err
}

func (r *AuthRepository) DeletePasswordResetToken(ctx context.Context, token string) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM verification WHERE value=$1`, token)
	return err
}

func (r *AuthRepository) UpdatePasswordHash(ctx context.Context, email, hashedPassword string) error {
	const q = `
		UPDATE account SET password=$1, updated_at=NOW()
		WHERE user_id=(SELECT id FROM "user" WHERE email=$2) AND provider_id='credential'`
	_, err := r.db.ExecContext(ctx, q, hashedPassword, email)
	return err
}

// GenerateSessionToken returns a cryptographically secure random session token.
func GenerateSessionToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

// NewSession creates a Session entity with a fresh token and 7-day expiry.
func NewSession(userID, ipAddress, userAgent string) (*entity.Session, error) {
	token, err := GenerateSessionToken()
	if err != nil {
		return nil, err
	}
	var ip *string
	if ipAddress != "" {
		ip = &ipAddress
	}
	var ua *string
	if userAgent != "" {
		ua = &userAgent
	}
	return &entity.Session{
		ID:        uuid.New().String(),
		Token:     token,
		UserID:    userID,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
		IPAddress: ip,
		UserAgent: ua,
	}, nil
}
