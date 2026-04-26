package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"backend/internal/domain/entity"
)

type OrganizationRepository struct {
	db *sql.DB
}

func NewOrganizationRepository(db *sql.DB) *OrganizationRepository {
	return &OrganizationRepository{db: db}
}

func (r *OrganizationRepository) FindAll(ctx context.Context, params entity.ListParams) ([]*entity.Organization, int, error) {
	where := "1=1"
	args := []interface{}{}
	idx := 1
	if params.Search != "" {
		where += fmt.Sprintf(" AND (name ILIKE $%d OR slug ILIKE $%d)", idx, idx+1)
		like := "%" + params.Search + "%"
		args = append(args, like, like)
		idx += 2
	}
	var total int
	err := r.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM organizations WHERE "+where, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}
	order := "created_at"
	if params.Sort != "" {
		order = params.Sort
	}
	dir := "DESC"
	if params.SortOrder == "asc" {
		dir = "ASC"
	}
	args = append(args, params.Limit, params.Offset)
	q := fmt.Sprintf(`SELECT id, name, slug, description, website, location, contact_email, created_at, updated_at
		FROM organizations WHERE %s ORDER BY %s %s LIMIT $%d OFFSET $%d`,
		where, order, dir, idx, idx+1)
	rows, err := r.db.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	orgs, err := scanOrganizations(rows)
	return orgs, total, err
}

func (r *OrganizationRepository) FindByID(ctx context.Context, id string) (*entity.Organization, error) {
	const q = `SELECT id, name, slug, description, website, location, contact_email, created_at, updated_at
		FROM organizations WHERE id=$1`
	row := r.db.QueryRowContext(ctx, q, id)
	return scanOrganization(row)
}

func (r *OrganizationRepository) FindBySlug(ctx context.Context, slug string) (*entity.Organization, error) {
	const q = `SELECT id, name, slug, description, website, location, contact_email, created_at, updated_at
		FROM organizations WHERE slug=$1`
	row := r.db.QueryRowContext(ctx, q, slug)
	return scanOrganization(row)
}

func (r *OrganizationRepository) CountCreatedSince(ctx context.Context, since time.Time) (int, error) {
	var count int
	err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM organizations WHERE created_at >= $1`, since).Scan(&count)
	return count, err
}

func (r *OrganizationRepository) Create(ctx context.Context, org *entity.Organization) error {
	const q = `INSERT INTO organizations (id, name, slug, description, website, location, contact_email, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`
	now := time.Now()
	_, err := r.db.ExecContext(ctx, q, org.ID, org.Name, org.Slug, org.Description, org.Website,
		org.Location, org.ContactEmail, now, now)
	return err
}

func (r *OrganizationRepository) Update(ctx context.Context, org *entity.Organization) error {
	const q = `UPDATE organizations SET name=$1, description=$2, website=$3, location=$4, contact_email=$5, updated_at=$6
		WHERE id=$7`
	_, err := r.db.ExecContext(ctx, q, org.Name, org.Description, org.Website, org.Location, org.ContactEmail, time.Now(), org.ID)
	return err
}

func scanOrganization(row *sql.Row) (*entity.Organization, error) {
	var o entity.Organization
	var desc, website, location, contactEmail sql.NullString
	err := row.Scan(&o.ID, &o.Name, &o.Slug, &desc, &website, &location, &contactEmail, &o.CreatedAt, &o.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if desc.Valid {
		o.Description = &desc.String
	}
	if website.Valid {
		o.Website = &website.String
	}
	if location.Valid {
		o.Location = &location.String
	}
	if contactEmail.Valid {
		o.ContactEmail = &contactEmail.String
	}
	return &o, nil
}

func scanOrganizations(rows *sql.Rows) ([]*entity.Organization, error) {
	var orgs []*entity.Organization
	for rows.Next() {
		var o entity.Organization
		var desc, website, location, contactEmail sql.NullString
		err := rows.Scan(&o.ID, &o.Name, &o.Slug, &desc, &website, &location, &contactEmail, &o.CreatedAt, &o.UpdatedAt)
		if err != nil {
			return nil, err
		}
		if desc.Valid {
			o.Description = &desc.String
		}
		if website.Valid {
			o.Website = &website.String
		}
		if location.Valid {
			o.Location = &location.String
		}
		if contactEmail.Valid {
			o.ContactEmail = &contactEmail.String
		}
		orgs = append(orgs, &o)
	}
	return orgs, rows.Err()
}

type OrganizationApplicationRepository struct {
	db *sql.DB
}

func NewOrganizationApplicationRepository(db *sql.DB) *OrganizationApplicationRepository {
	return &OrganizationApplicationRepository{db: db}
}

func (r *OrganizationApplicationRepository) FindAll(ctx context.Context) ([]*entity.OrganizationApplication, error) {
	const q = `SELECT id, organization_name, applicant_name, applicant_email, website,
		certificate_of_incorporation, status, created_at, updated_at
		FROM organization_applications ORDER BY created_at DESC`
	rows, err := r.db.QueryContext(ctx, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var apps []*entity.OrganizationApplication
	for rows.Next() {
		a := &entity.OrganizationApplication{}
		var website, cert sql.NullString
		err := rows.Scan(&a.ID, &a.OrganizationName, &a.ApplicantName, &a.ApplicantEmail,
			&website, &cert, &a.Status, &a.CreatedAt, &a.UpdatedAt)
		if err != nil {
			return nil, err
		}
		if website.Valid {
			a.Website = &website.String
		}
		if cert.Valid {
			a.CertificateOfIncorporation = &cert.String
		}
		apps = append(apps, a)
	}
	return apps, rows.Err()
}

func (r *OrganizationApplicationRepository) FindByID(ctx context.Context, id int) (*entity.OrganizationApplication, error) {
	const q = `SELECT id, organization_name, applicant_name, applicant_email, website,
		certificate_of_incorporation, status, created_at, updated_at
		FROM organization_applications WHERE id=$1`
	a := &entity.OrganizationApplication{}
	var website, cert sql.NullString
	err := r.db.QueryRowContext(ctx, q, id).Scan(&a.ID, &a.OrganizationName, &a.ApplicantName, &a.ApplicantEmail,
		&website, &cert, &a.Status, &a.CreatedAt, &a.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if website.Valid {
		a.Website = &website.String
	}
	if cert.Valid {
		a.CertificateOfIncorporation = &cert.String
	}
	return a, nil
}

func (r *OrganizationApplicationRepository) Create(ctx context.Context, app *entity.OrganizationApplication) error {
	const q = `INSERT INTO organization_applications
		(organization_name, applicant_name, applicant_email, website, certificate_of_incorporation, status, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`
	now := time.Now()
	_, err := r.db.ExecContext(ctx, q, app.OrganizationName, app.ApplicantName, app.ApplicantEmail,
		app.Website, app.CertificateOfIncorporation, string(app.Status), now, now)
	return err
}

func (r *OrganizationApplicationRepository) UpdateStatus(ctx context.Context, id int, status entity.ApplicationStatus) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE organization_applications SET status=$1, updated_at=$2 WHERE id=$3`,
		string(status), time.Now(), id)
	return err
}
