package insightusecase

import (
	"context"

	"backend/internal/domain/entity"
	domainerrors "backend/internal/domain/errors"
	"backend/internal/domain/repository"
)

type UseCase struct {
	repo repository.InsightRepository
}

func New(repo repository.InsightRepository) *UseCase {
	return &UseCase{repo: repo}
}

func (uc *UseCase) GetPublicInsights(ctx context.Context, params entity.ListParams, tags []string) ([]*entity.Insight, int, error) {
	return uc.repo.FindPublic(ctx, params, tags)
}

func (uc *UseCase) GetPublicInsightBySlug(ctx context.Context, slug string) (*entity.Insight, error) {
	i, err := uc.repo.FindPublicBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}
	if i == nil {
		return nil, domainerrors.NewNotFound("insight not found")
	}
	return i, nil
}

func (uc *UseCase) GetTags(ctx context.Context) ([]*entity.InsightTag, error) {
	return uc.repo.FindAllTags(ctx)
}

func (uc *UseCase) CreateInsight(ctx context.Context, insight *entity.Insight) error {
	return uc.repo.Create(ctx, insight)
}
