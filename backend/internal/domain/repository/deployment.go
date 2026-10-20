package repository

import (
	"context"

	"backend/internal/domain/entity"
)

type DeploymentRepository interface {
	// FindAll lists deployments, newest first, with their organization's
	// name and incident types; organizationID narrows it to one.
	FindAll(ctx context.Context, organizationID *string) ([]*entity.Deployment, error)
	// FindBySlug and FindByID return nil, nil when there is none.
	FindBySlug(ctx context.Context, slug string) (*entity.Deployment, error)
	FindByID(ctx context.Context, id string) (*entity.Deployment, error)
	UpdateStatus(ctx context.Context, id string, status entity.DeploymentStatus) error
	SlugExists(ctx context.Context, slug string) (bool, error)
	// CountByStatus counts deployments by status; organizationID narrows
	// it to one organization.
	CountByStatus(ctx context.Context, organizationID *string) (entity.DeploymentCounts, error)
	// Create saves the deployment and its incident types together.
	Create(ctx context.Context, d *entity.Deployment, incidentTypeIDs []string) error
}
