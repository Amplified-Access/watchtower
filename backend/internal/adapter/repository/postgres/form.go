package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"

	"backend/internal/domain/entity"
)

type FormRepository struct {
	db *sql.DB
}

func NewFormRepository(db *sql.DB) *FormRepository {
	return &FormRepository{db: db}
}

func (r *FormRepository) FindByOrganizationID(ctx context.Context, orgID string) ([]*entity.Form, error) {
	const q = `SELECT id, organization_id, name, definition, is_active, created_at, updated_at
		FROM forms WHERE organization_id=$1 ORDER BY created_at DESC`
	rows, err := r.db.QueryContext(ctx, q, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanForms(rows)
}

func (r *FormRepository) FindActiveByOrganizationID(ctx context.Context, orgID string) ([]*entity.Form, error) {
	const q = `SELECT id, organization_id, name, definition, is_active, created_at, updated_at
		FROM forms WHERE organization_id=$1 AND is_active=true ORDER BY name ASC`
	rows, err := r.db.QueryContext(ctx, q, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanForms(rows)
}

func (r *FormRepository) FindByID(ctx context.Context, id string) (*entity.Form, error) {
	const q = `SELECT id, organization_id, name, definition, is_active, created_at, updated_at
		FROM forms WHERE id=$1`
	rows, err := r.db.QueryContext(ctx, q, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	forms, err := scanForms(rows)
	if err != nil || len(forms) == 0 {
		return nil, err
	}
	return forms[0], nil
}

func (r *FormRepository) FindAllForSuperAdmin(ctx context.Context, params entity.ListParams) ([]*entity.Form, int, error) {
	where := "1=1"
	args := []interface{}{}
	idx := 1
	if params.Search != "" {
		where += fmt.Sprintf(" AND name ILIKE $%d", idx)
		args = append(args, "%"+params.Search+"%")
		idx++
	}
	var total int
	if err := r.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM forms WHERE "+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}
	args = append(args, params.Limit, params.Offset)
	q := fmt.Sprintf(`SELECT id, organization_id, name, definition, is_active, created_at, updated_at
		FROM forms WHERE %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d`, where, idx, idx+1)
	rows, err := r.db.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	forms, err := scanForms(rows)
	return forms, total, err
}

func (r *FormRepository) Create(ctx context.Context, form *entity.Form) error {
	if form.ID == "" {
		form.ID = uuid.NewString()
	}
	defJSON, err := json.Marshal(form.Definition)
	if err != nil {
		return err
	}
	now := time.Now()
	_, err = r.db.ExecContext(ctx,
		`INSERT INTO forms (id, organization_id, name, definition, is_active, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7)`,
		form.ID, form.OrganizationID, form.Name, defJSON, form.IsActive, now, now)
	return err
}

func (r *FormRepository) Update(ctx context.Context, form *entity.Form) error {
	defJSON, err := json.Marshal(form.Definition)
	if err != nil {
		return err
	}
	_, err = r.db.ExecContext(ctx,
		`UPDATE forms SET name=$1, definition=$2, is_active=$3, updated_at=$4 WHERE id=$5`,
		form.Name, defJSON, form.IsActive, time.Now(), form.ID)
	return err
}

func (r *FormRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM forms WHERE id=$1`, id)
	return err
}

func scanForms(rows *sql.Rows) ([]*entity.Form, error) {
	var forms []*entity.Form
	for rows.Next() {
		var f entity.Form
		var defJSON []byte
		if err := rows.Scan(&f.ID, &f.OrganizationID, &f.Name, &defJSON, &f.IsActive, &f.CreatedAt, &f.UpdatedAt); err != nil {
			return nil, err
		}
		if err := json.Unmarshal(defJSON, &f.Definition); err != nil {
			return nil, err
		}
		forms = append(forms, &f)
	}
	return forms, rows.Err()
}
