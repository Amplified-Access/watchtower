package postgres

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"

	"backend/internal/domain/entity"
	domainerrors "backend/internal/domain/errors"
)

const pgForeignKeyViolation = "23503"

type DeploymentRepository struct {
	db *sql.DB
}

func NewDeploymentRepository(db *sql.DB) *DeploymentRepository {
	return &DeploymentRepository{db: db}
}

func (r *DeploymentRepository) FindAll(ctx context.Context, organizationID *string) ([]*entity.Deployment, error) {
	q := `SELECT d.id, d.organization_id, o.name, d.name, d.slug, d.description, d.country, d.region,
			d.status, d.starts_at, d.ends_at, d.created_at, d.updated_at
		FROM deployments d JOIN organizations o ON o.id = d.organization_id`
	args := []interface{}{}
	if organizationID != nil {
		q += " WHERE d.organization_id = $1"
		args = append(args, *organizationID)
	}
	q += " ORDER BY d.created_at DESC"

	rows, err := r.db.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	deployments := []*entity.Deployment{}
	byID := map[string]*entity.Deployment{}
	ids := []string{}
	for rows.Next() {
		d := &entity.Deployment{IncidentTypes: []entity.IncidentType{}}
		if err := rows.Scan(&d.ID, &d.OrganizationID, &d.OrganizationName, &d.Name, &d.Slug,
			&d.Description, &d.Country, &d.Region, &d.Status, &d.StartsAt, &d.EndsAt,
			&d.CreatedAt, &d.UpdatedAt); err != nil {
			return nil, err
		}
		deployments = append(deployments, d)
		byID[d.ID] = d
		ids = append(ids, d.ID)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if len(ids) == 0 {
		return deployments, nil
	}

	// The themes, for every deployment above in one query.
	typeRows, err := r.db.QueryContext(ctx, `
		SELECT dit.deployment_id, it.id, it.name, it.description, it.color, it.is_active, it.created_at, it.updated_at
		FROM deployment_incident_types dit
		JOIN incident_types it ON it.id = dit.incident_type_id
		WHERE dit.deployment_id = ANY($1)
		ORDER BY it.name`, ids)
	if err != nil {
		return nil, err
	}
	defer typeRows.Close()
	for typeRows.Next() {
		var deploymentID string
		var t entity.IncidentType
		if err := typeRows.Scan(&deploymentID, &t.ID, &t.Name, &t.Description, &t.Color,
			&t.IsActive, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		byID[deploymentID].IncidentTypes = append(byID[deploymentID].IncidentTypes, t)
	}
	return deployments, typeRows.Err()
}

func (r *DeploymentRepository) CountByStatus(ctx context.Context, organizationID *string) (entity.DeploymentCounts, error) {
	q := `SELECT COUNT(*),
			COUNT(*) FILTER (WHERE status = 'draft'),
			COUNT(*) FILTER (WHERE status = 'live'),
			COUNT(*) FILTER (WHERE status = 'closed')
		FROM deployments`
	args := []interface{}{}
	if organizationID != nil {
		q += " WHERE organization_id = $1"
		args = append(args, *organizationID)
	}
	var c entity.DeploymentCounts
	err := r.db.QueryRowContext(ctx, q, args...).Scan(&c.Total, &c.Draft, &c.Live, &c.Closed)
	return c, err
}

func (r *DeploymentRepository) SlugExists(ctx context.Context, slug string) (bool, error) {
	var exists bool
	err := r.db.QueryRowContext(ctx, `SELECT EXISTS (SELECT 1 FROM deployments WHERE slug = $1)`, slug).Scan(&exists)
	return exists, err
}

func (r *DeploymentRepository) Create(ctx context.Context, d *entity.Deployment, incidentTypeIDs []string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback() //nolint:errcheck // a no-op once committed

	now := time.Now()
	d.ID = uuid.New().String()
	d.CreatedAt, d.UpdatedAt = now, now
	_, err = tx.ExecContext(ctx, `
		INSERT INTO deployments (id, organization_id, name, slug, description, country, region,
			status, starts_at, ends_at, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
		d.ID, d.OrganizationID, d.Name, d.Slug, d.Description, d.Country, d.Region,
		string(d.Status), d.StartsAt, d.EndsAt, now, now)
	if err != nil {
		return mapDeploymentError(err)
	}
	for _, typeID := range incidentTypeIDs {
		if _, err := tx.ExecContext(ctx,
			`INSERT INTO deployment_incident_types (deployment_id, incident_type_id) VALUES ($1, $2)`,
			d.ID, typeID); err != nil {
			return mapDeploymentError(err)
		}
	}
	return tx.Commit()
}

// mapDeploymentError turns the constraints a caller can trip into 4xx
// errors: a slug taken by a concurrent create, or an incident type (or
// organization) that doesn't exist.
func mapDeploymentError(err error) error {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case pgUniqueViolation:
			return domainerrors.NewConflict("a deployment with this name already exists; try another name")
		case pgForeignKeyViolation:
			return domainerrors.NewBadRequest("unknown incident type or organization")
		}
	}
	return err
}
