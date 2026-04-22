package userusecase

import (
	"context"

	"backend/internal/domain/entity"
	domainerrors "backend/internal/domain/errors"
	"backend/internal/domain/repository"
)

type UseCase struct {
	userRepo    repository.UserRepository
	sessionRepo repository.SessionRepository
}

func New(userRepo repository.UserRepository, sessionRepo repository.SessionRepository) *UseCase {
	return &UseCase{userRepo: userRepo, sessionRepo: sessionRepo}
}

func (uc *UseCase) GetCurrentUser(ctx context.Context, token string) (*entity.User, error) {
	user, err := uc.sessionRepo.FindUserByToken(ctx, token)
	if err != nil {
		return nil, domainerrors.NewUnauthorized("invalid or expired session")
	}
	if user == nil {
		return nil, domainerrors.NewUnauthorized("session not found")
	}
	if user.Banned {
		return nil, domainerrors.NewForbidden("user is banned")
	}
	return user, nil
}

func (uc *UseCase) GetAllByRole(ctx context.Context, role entity.UserRole) ([]*entity.User, error) {
	r := role
	return uc.userRepo.FindAll(ctx, &r)
}

func (uc *UseCase) GetByID(ctx context.Context, id string) (*entity.User, error) {
	user, err := uc.userRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, domainerrors.NewNotFound("user not found")
	}
	return user, nil
}
