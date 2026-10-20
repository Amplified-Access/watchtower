package repository

import (
	"context"

	"backend/internal/domain/entity"
)

type DeploymentRepository interface {
	// FindAll lists deployments, newest first, with their organization's
	// name and incident types; organizationID narrows it to one.
	FindAll(ctx context.Context, organizationID *string) ([]*entity.Deployment, error)
	SlugExists(ctx context.Context, slug string) (bool, error)
	// Create saves the deployment and its incident types together.
	Create(ctx context.Context, d *entity.Deployment, incidentTypeIDs []string) error
}
