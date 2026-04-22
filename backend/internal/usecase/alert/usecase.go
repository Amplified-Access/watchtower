package alertusecase

import (
	"context"

	"backend/internal/domain/entity"
	"backend/internal/domain/repository"
)

type UseCase struct {
	repo repository.AlertSubscriptionRepository
}

func New(repo repository.AlertSubscriptionRepository) *UseCase {
	return &UseCase{repo: repo}
}

func (uc *UseCase) Create(ctx context.Context, sub *entity.AlertSubscription) error {
	return uc.repo.Create(ctx, sub)
}

func (uc *UseCase) GetByEmail(ctx context.Context, email string) ([]*entity.AlertSubscription, error) {
	return uc.repo.FindByEmail(ctx, email)
}

func (uc *UseCase) Update(ctx context.Context, sub *entity.AlertSubscription) error {
	return uc.repo.Update(ctx, sub)
}

func (uc *UseCase) Deactivate(ctx context.Context, id string) error {
	return uc.repo.UpdateStatus(ctx, id, false)
}

func (uc *UseCase) Activate(ctx context.Context, id string) error {
	return uc.repo.UpdateStatus(ctx, id, true)
}

func (uc *UseCase) GetAllActive(ctx context.Context) ([]*entity.AlertSubscription, error) {
	return uc.repo.FindAllActive(ctx)
}

func (uc *UseCase) GetStats(ctx context.Context) (*entity.AlertStats, error) {
	return uc.repo.GetStats(ctx)
}
