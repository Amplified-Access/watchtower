package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"

	"backend/internal/domain/entity"
)

type DatasetRepository struct {
	db *sql.DB
}

func NewDatasetRepository(db *sql.DB) *DatasetRepository {
	return &DatasetRepository{db: db}
}

const datasetCols = `id, title, description, category, tags, file_key, file_name, file_size, file_type,
	download_count, is_public, published_at, created_at, updated_at,
	source, license, version, coverage, format, keywords, methodology`

func (r *DatasetRepository) FindPublic(ctx context.Context, params entity.ListParams, category *string) ([]*entity.Dataset, int, error) {
	where := "is_public=true"
	args := []interface{}{}
	idx := 1
	if params.Search != "" {
		where += fmt.Sprintf(" AND (title ILIKE $%d OR description ILIKE $%d)", idx, idx+1)
		like := "%" + params.Search + "%"
		args = append(args, like, like)
		idx += 2
	}
	if category != nil {
		where += fmt.Sprintf(" AND category=$%d", idx)
		args = append(args, *category)
		idx++
	}
	var total int
	if err := r.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM datasets WHERE "+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}
	args = append(args, params.Limit, params.Offset)
	q := fmt.Sprintf("SELECT %s FROM datasets WHERE %s ORDER BY published_at DESC LIMIT $%d OFFSET $%d",
		datasetCols, where, idx, idx+1)
	rows, err := r.db.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	datasets, err := scanDatasets(rows)
	return datasets, total, err
}

func (r *DatasetRepository) FindByID(ctx context.Context, id string) (*entity.Dataset, error) {
	q := fmt.Sprintf("SELECT %s FROM datasets WHERE id=$1", datasetCols)
	rows, err := r.db.QueryContext(ctx, q, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	datasets, err := scanDatasets(rows)
	if err != nil || len(datasets) == 0 {
		return nil, err
	}
	return datasets[0], nil
}

func (r *DatasetRepository) FindAll(ctx context.Context, params entity.ListParams) ([]*entity.Dataset, int, error) {
	where := "1=1"
	args := []interface{}{}
	idx := 1
	if params.Search != "" {
		where += fmt.Sprintf(" AND title ILIKE $%d", idx)
		args = append(args, "%"+params.Search+"%")
		idx++
	}
	var total int
	if err := r.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM datasets WHERE "+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}
	args = append(args, params.Limit, params.Offset)
	q := fmt.Sprintf("SELECT %s FROM datasets WHERE %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d",
		datasetCols, where, idx, idx+1)
	rows, err := r.db.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	datasets, err := scanDatasets(rows)
	return datasets, total, err
}

func (r *DatasetRepository) FindCategories(ctx context.Context) ([]string, error) {
	rows, err := r.db.QueryContext(ctx, "SELECT DISTINCT category FROM datasets WHERE is_public=true ORDER BY category")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var categories []string
	for rows.Next() {
		var c string
		if err := rows.Scan(&c); err != nil {
			return nil, err
		}
		categories = append(categories, c)
	}
	return categories, rows.Err()
}

func (r *DatasetRepository) Create(ctx context.Context, d *entity.Dataset) error {
	if d.ID == "" {
		d.ID = uuid.NewString()
	}
	now := time.Now()
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO datasets (id, title, description, category, tags, file_key, file_name, file_size, file_type,
		download_count, is_public, published_at, created_at, updated_at, source, license, version, coverage, format, keywords, methodology)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
		d.ID, d.Title, d.Description, d.Category, stringsToArray(d.Tags), d.FileKey, d.FileName, d.FileSize, d.FileType,
		d.DownloadCount, d.IsPublic, now, now, now, d.Source, d.License, d.Version, d.Coverage, d.Format,
		stringsToArray(d.Keywords), d.Methodology)
	return err
}

func (r *DatasetRepository) Update(ctx context.Context, d *entity.Dataset) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE datasets SET title=$1, description=$2, category=$3, is_public=$4, source=$5,
		license=$6, coverage=$7, methodology=$8, updated_at=$9 WHERE id=$10`,
		d.Title, d.Description, d.Category, d.IsPublic, d.Source, d.License, d.Coverage, d.Methodology, time.Now(), d.ID)
	return err
}

func (r *DatasetRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, "DELETE FROM datasets WHERE id=$1", id)
	return err
}

func (r *DatasetRepository) IncrementDownload(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, "UPDATE datasets SET download_count=download_count+1, updated_at=$1 WHERE id=$2", time.Now(), id)
	return err
}

// stringsToArray converts a Go string slice to a PostgreSQL array literal (e.g. {"a","b"}).
// pgx stdlib accepts this directly as a text[] parameter.
func stringsToArray(ss []string) string {
	if len(ss) == 0 {
		return "{}"
	}
	quoted := make([]string, len(ss))
	for i, s := range ss {
		quoted[i] = `"` + strings.ReplaceAll(s, `"`, `\"`) + `"`
	}
	return "{" + strings.Join(quoted, ",") + "}"
}

// arrayToStrings parses a PostgreSQL array literal into a Go slice.
func arrayToStrings(s string) []string {
	s = strings.TrimPrefix(s, "{")
	s = strings.TrimSuffix(s, "}")
	if s == "" {
		return nil
	}
	parts := strings.Split(s, ",")
	result := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		p = strings.Trim(p, `"`)
		result = append(result, p)
	}
	return result
}

func scanDatasets(rows *sql.Rows) ([]*entity.Dataset, error) {
	var datasets []*entity.Dataset
	for rows.Next() {
		var d entity.Dataset
		var source, coverage, methodology sql.NullString
		var publishedAt sql.NullTime
		var tagsStr, keywordsStr sql.NullString
		if err := rows.Scan(&d.ID, &d.Title, &d.Description, &d.Category,
			&tagsStr, &d.FileKey, &d.FileName, &d.FileSize, &d.FileType,
			&d.DownloadCount, &d.IsPublic, &publishedAt, &d.CreatedAt, &d.UpdatedAt,
			&source, &d.License, &d.Version, &coverage, &d.Format,
			&keywordsStr, &methodology); err != nil {
			return nil, err
		}
		if tagsStr.Valid {
			d.Tags = arrayToStrings(tagsStr.String)
		}
		if keywordsStr.Valid {
			d.Keywords = arrayToStrings(keywordsStr.String)
		}
		if source.Valid {
			d.Source = &source.String
		}
		if coverage.Valid {
			d.Coverage = &coverage.String
		}
		if methodology.Valid {
			d.Methodology = &methodology.String
		}
		if publishedAt.Valid {
			d.PublishedAt = &publishedAt.Time
		}
		datasets = append(datasets, &d)
	}
	return datasets, rows.Err()
}
