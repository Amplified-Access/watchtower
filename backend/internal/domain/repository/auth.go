package repository

import (
	"context"
	"time"

	"backend/internal/domain/entity"
)

type AuthRepository interface {
	CreateUser(ctx context.Context, user *entity.User) error
	CreateSession(ctx context.Context, session *entity.Session) error
	DeleteSession(ctx context.Context, token string) error
	GetPasswordHash(ctx context.Context, userID string) (string, error)
	CreatePasswordCredential(ctx context.Context, userID, hashedPassword string) error
	CreatePasswordResetToken(ctx context.Context, email, token string, expiresAt time.Time) error
	GetPasswordResetToken(ctx context.Context, token string) (email string, expiresAt time.Time, err error)
	DeletePasswordResetToken(ctx context.Context, token string) error
	UpdatePasswordHash(ctx context.Context, email, hashedPassword string) error
}
