package repository

import (
	"context"

	"backend/internal/domain/entity"
)

type AlertSubscriptionRepository interface {
	FindByEmail(ctx context.Context, email string) ([]*entity.AlertSubscription, error)
	FindAllActive(ctx context.Context) ([]*entity.AlertSubscription, error)
	Create(ctx context.Context, sub *entity.AlertSubscription) error
	Update(ctx context.Context, sub *entity.AlertSubscription) error
	UpdateStatus(ctx context.Context, id string, isActive bool) error
	GetStats(ctx context.Context) (*entity.AlertStats, error)
}
