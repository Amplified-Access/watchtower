package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"

	"backend/internal/domain/entity"
)

type ReportRepository struct {
	db *sql.DB
}

func NewReportRepository(db *sql.DB) *ReportRepository {
	return &ReportRepository{db: db}
}

func (r *ReportRepository) FindPublic(ctx context.Context, params entity.ListParams) ([]*entity.Report, int, error) {
	where := "status='published'"
	args := []interface{}{}
	idx := 1
	if params.Search != "" {
		where += fmt.Sprintf(" AND title ILIKE $%d", idx)
		args = append(args, "%"+params.Search+"%")
		idx++
	}
	var total int
	if err := r.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM reports WHERE "+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}
	args = append(args, params.Limit, params.Offset)
	q := fmt.Sprintf(`SELECT id, organization_id, reported_by_user_id, title, file_key, status, created_at, updated_at
		FROM reports WHERE %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d`, where, idx, idx+1)
	rows, err := r.db.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	reports, err := scanReports(rows)
	return reports, total, err
}

func (r *ReportRepository) FindPublicByID(ctx context.Context, id string) (*entity.Report, error) {
	const q = `SELECT id, organization_id, reported_by_user_id, title, file_key, status, created_at, updated_at
		FROM reports WHERE id=$1 AND status='published'`
	rows, err := r.db.QueryContext(ctx, q, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	reports, err := scanReports(rows)
	if err != nil || len(reports) == 0 {
		return nil, err
	}
	return reports[0], nil
}

func (r *ReportRepository) FindByOrganizationID(ctx context.Context, orgID string, status *entity.ReportStatus) ([]*entity.Report, error) {
	q := `SELECT id, organization_id, reported_by_user_id, title, file_key, status, created_at, updated_at
		FROM reports WHERE organization_id=$1`
	args := []interface{}{orgID}
	if status != nil {
		q += " AND status=$2"
		args = append(args, string(*status))
	}
	q += " ORDER BY created_at DESC"
	rows, err := r.db.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanReports(rows)
}

func (r *ReportRepository) FindByID(ctx context.Context, id string) (*entity.Report, error) {
	const q = `SELECT id, organization_id, reported_by_user_id, title, file_key, status, created_at, updated_at
		FROM reports WHERE id=$1`
	rows, err := r.db.QueryContext(ctx, q, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	reports, err := scanReports(rows)
	if err != nil || len(reports) == 0 {
		return nil, err
	}
	return reports[0], nil
}

func (r *ReportRepository) FindAllForSuperAdmin(ctx context.Context, params entity.ListParams) ([]*entity.Report, int, error) {
	where := "1=1"
	args := []interface{}{}
	idx := 1
	if params.Search != "" {
		where += fmt.Sprintf(" AND title ILIKE $%d", idx)
		args = append(args, "%"+params.Search+"%")
		idx++
	}
	var total int
	if err := r.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM reports WHERE "+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}
	args = append(args, params.Limit, params.Offset)
	q := fmt.Sprintf(`SELECT id, organization_id, reported_by_user_id, title, file_key, status, created_at, updated_at
		FROM reports WHERE %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d`, where, idx, idx+1)
	rows, err := r.db.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	reports, err := scanReports(rows)
	return reports, total, err
}

func (r *ReportRepository) Create(ctx context.Context, report *entity.Report) error {
	if report.ID == "" {
		report.ID = uuid.NewString()
	}
	now := time.Now()
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO reports (id, organization_id, reported_by_user_id, title, file_key, status, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
		report.ID, report.OrganizationID, report.ReportedByUserID, report.Title, report.FileKey, string(report.Status), now, now)
	return err
}

func (r *ReportRepository) Update(ctx context.Context, report *entity.Report) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE reports SET title=$1, file_key=$2, status=$3, updated_at=$4 WHERE id=$5`,
		report.Title, report.FileKey, string(report.Status), time.Now(), report.ID)
	return err
}

func (r *ReportRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM reports WHERE id=$1`, id)
	return err
}

func scanReports(rows *sql.Rows) ([]*entity.Report, error) {
	var reports []*entity.Report
	for rows.Next() {
		var r entity.Report
		if err := rows.Scan(&r.ID, &r.OrganizationID, &r.ReportedByUserID, &r.Title, &r.FileKey, &r.Status, &r.CreatedAt, &r.UpdatedAt); err != nil {
			return nil, err
		}
		reports = append(reports, &r)
	}
	return reports, rows.Err()
}
