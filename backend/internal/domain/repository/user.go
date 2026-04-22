package repository

import (
	"context"

	"backend/internal/domain/entity"
)

type UserRepository interface {
	FindByID(ctx context.Context, id string) (*entity.User, error)
	FindByEmail(ctx context.Context, email string) (*entity.User, error)
	FindAll(ctx context.Context, role *entity.UserRole) ([]*entity.User, error)
	Update(ctx context.Context, user *entity.User) error
	Delete(ctx context.Context, id string) error
}

type SessionRepository interface {
	FindByToken(ctx context.Context, token string) (*entity.Session, error)
	FindUserByToken(ctx context.Context, token string) (*entity.User, error)
}
