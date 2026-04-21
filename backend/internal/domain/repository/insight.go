package repository

import (
	"context"

	"backend/internal/domain/entity"
)

type InsightRepository interface {
	FindPublic(ctx context.Context, params entity.ListParams, tags []string) ([]*entity.Insight, int, error)
	FindPublicBySlug(ctx context.Context, slug string) (*entity.Insight, error)
	FindAllTags(ctx context.Context) ([]*entity.InsightTag, error)
	Create(ctx context.Context, insight *entity.Insight) error
}
