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

type IncidentTypeRepository struct {
	db *sql.DB
}

func NewIncidentTypeRepository(db *sql.DB) *IncidentTypeRepository {
	return &IncidentTypeRepository{db: db}
}

func (r *IncidentTypeRepository) FindAll(ctx context.Context, activeOnly bool) ([]*entity.IncidentType, error) {
	q := `SELECT id, name, description, color, is_active, created_at, updated_at FROM incident_types`
	if activeOnly {
		q += " WHERE is_active=true"
	}
	q += " ORDER BY name ASC"
	rows, err := r.db.QueryContext(ctx, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanIncidentTypes(rows)
}

func (r *IncidentTypeRepository) FindByID(ctx context.Context, id string) (*entity.IncidentType, error) {
	const q = `SELECT id, name, description, color, is_active, created_at, updated_at FROM incident_types WHERE id=$1`
	row := r.db.QueryRowContext(ctx, q, id)
	return scanIncidentType(row)
}

func (r *IncidentTypeRepository) FindByOrganizationID(ctx context.Context, orgID string) ([]*entity.IncidentType, error) {
	const q = `
		SELECT it.id, it.name, it.description, it.color, it.is_active, it.created_at, it.updated_at
		FROM incident_types it
		JOIN organization_incident_types oit ON oit.incident_type_id=it.id
		WHERE oit.organization_id=$1 AND oit.is_enabled=true AND it.is_active=true
		ORDER BY it.name ASC`
	rows, err := r.db.QueryContext(ctx, q, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanIncidentTypes(rows)
}

func (r *IncidentTypeRepository) FindAvailableForOrganization(ctx context.Context, orgID string) ([]*entity.IncidentType, error) {
	const q = `
		SELECT id, name, description, color, is_active, created_at, updated_at
		FROM incident_types
		WHERE is_active=true
		AND id NOT IN (
			SELECT incident_type_id FROM organization_incident_types WHERE organization_id=$1
		)
		ORDER BY name ASC`
	rows, err := r.db.QueryContext(ctx, q, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanIncidentTypes(rows)
}

func (r *IncidentTypeRepository) Create(ctx context.Context, t *entity.IncidentType) error {
	if t.ID == "" {
		t.ID = uuid.NewString()
	}
	now := time.Now()
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO incident_types (id, name, description, color, is_active, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7)`,
		t.ID, t.Name, t.Description, t.Color, t.IsActive, now, now)
	return err
}

func (r *IncidentTypeRepository) EnableForOrganization(ctx context.Context, orgID, typeID string) error {
	const q = `
		INSERT INTO organization_incident_types (id, organization_id, incident_type_id, is_enabled, created_at, updated_at)
		VALUES ($1,$2,$3,true,$4,$5)
		ON CONFLICT (organization_id, incident_type_id) DO UPDATE SET is_enabled=true, updated_at=$5`
	now := time.Now()
	_, err := r.db.ExecContext(ctx, q, uuid.NewString(), orgID, typeID, now, now)
	return err
}

func (r *IncidentTypeRepository) DisableForOrganization(ctx context.Context, orgID, typeID string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE organization_incident_types SET is_enabled=false, updated_at=$1
		WHERE organization_id=$2 AND incident_type_id=$3`,
		time.Now(), orgID, typeID)
	return err
}

func scanIncidentType(row *sql.Row) (*entity.IncidentType, error) {
	var t entity.IncidentType
	var desc sql.NullString
	err := row.Scan(&t.ID, &t.Name, &desc, &t.Color, &t.IsActive, &t.CreatedAt, &t.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if desc.Valid {
		t.Description = &desc.String
	}
	return &t, nil
}

func scanIncidentTypes(rows *sql.Rows) ([]*entity.IncidentType, error) {
	var types []*entity.IncidentType
	for rows.Next() {
		var t entity.IncidentType
		var desc sql.NullString
		if err := rows.Scan(&t.ID, &t.Name, &desc, &t.Color, &t.IsActive, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		if desc.Valid {
			t.Description = &desc.String
		}
		types = append(types, &t)
	}
	return types, rows.Err()
}

type IncidentRepository struct {
	db *sql.DB
}

func NewIncidentRepository(db *sql.DB) *IncidentRepository {
	return &IncidentRepository{db: db}
}

func (r *IncidentRepository) FindAll(ctx context.Context, orgID string, params entity.ListParams) ([]*entity.Incident, int, error) {
	args := []interface{}{orgID}
	idx := 2
	where := "organization_id=$1"
	if params.Search != "" {
		where += fmt.Sprintf(" AND status ILIKE $%d", idx)
		args = append(args, "%"+params.Search+"%")
		idx++
	}
	var total int
	if err := r.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM incidents WHERE "+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}
	args = append(args, params.Limit, params.Offset)
	q := fmt.Sprintf(`SELECT id, organization_id, form_id, reported_by_user_id, data, status, created_at, updated_at
		FROM incidents WHERE %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d`, where, idx, idx+1)
	rows, err := r.db.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	incidents, err := scanIncidents(rows)
	return incidents, total, err
}

func (r *IncidentRepository) FindByID(ctx context.Context, id string) (*entity.Incident, error) {
	const q = `SELECT id, organization_id, form_id, reported_by_user_id, data, status, created_at, updated_at
		FROM incidents WHERE id=$1`
	row := r.db.QueryRowContext(ctx, q, id)
	var i entity.Incident
	var dataJSON []byte
	err := row.Scan(&i.ID, &i.OrganizationID, &i.FormID, &i.ReportedByUserID, &dataJSON, &i.Status, &i.CreatedAt, &i.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if err := json.Unmarshal(dataJSON, &i.Data); err != nil {
		return nil, err
	}
	return &i, nil
}

func (r *IncidentRepository) FindAllForSuperAdmin(ctx context.Context, params entity.ListParams) ([]*entity.Incident, int, error) {
	where := "1=1"
	args := []interface{}{}
	idx := 1
	if params.Search != "" {
		where += fmt.Sprintf(" AND status ILIKE $%d", idx)
		args = append(args, "%"+params.Search+"%")
		idx++
	}
	var total int
	if err := r.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM incidents WHERE "+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}
	args = append(args, params.Limit, params.Offset)
	q := fmt.Sprintf(`SELECT id, organization_id, form_id, reported_by_user_id, data, status, created_at, updated_at
		FROM incidents WHERE %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d`, where, idx, idx+1)
	rows, err := r.db.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	incidents, err := scanIncidents(rows)
	return incidents, total, err
}

func (r *IncidentRepository) Create(ctx context.Context, i *entity.Incident) error {
	if i.ID == "" {
		i.ID = uuid.NewString()
	}
	dataJSON, err := json.Marshal(i.Data)
	if err != nil {
		return err
	}
	now := time.Now()
	_, err = r.db.ExecContext(ctx,
		`INSERT INTO incidents (id, organization_id, form_id, reported_by_user_id, data, status, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
		i.ID, i.OrganizationID, i.FormID, i.ReportedByUserID, dataJSON, string(i.Status), now, now)
	return err
}

func (r *IncidentRepository) UpdateStatus(ctx context.Context, id string, status entity.IncidentStatus) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE incidents SET status=$1, updated_at=$2 WHERE id=$3`,
		string(status), time.Now(), id)
	return err
}

func (r *IncidentRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM incidents WHERE id=$1`, id)
	return err
}

func (r *IncidentRepository) GetStats(ctx context.Context, orgID string) (*entity.IncidentStats, error) {
	const q = `
		SELECT
			COUNT(*) AS total,
			SUM(CASE WHEN status='reported' THEN 1 ELSE 0 END) AS reported,
			SUM(CASE WHEN status='investigating' THEN 1 ELSE 0 END) AS investigating,
			SUM(CASE WHEN status='resolved' THEN 1 ELSE 0 END) AS resolved,
			SUM(CASE WHEN status='closed' THEN 1 ELSE 0 END) AS closed,
			SUM(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) AS this_week,
			SUM(CASE WHEN created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) AS last_week
		FROM incidents WHERE organization_id=$1`
	var s entity.IncidentStats
	err := r.db.QueryRowContext(ctx, q, orgID).Scan(&s.Total, &s.Reported, &s.Investigating, &s.Resolved, &s.Closed, &s.ThisWeek, &s.LastWeek)
	return &s, err
}

func (r *IncidentRepository) GetWeeklyTrend(ctx context.Context, orgID string) ([]*entity.WeeklyTrendPoint, error) {
	const q = `
		SELECT TO_CHAR(DATE_TRUNC('week', created_at), 'YYYY-MM-DD') AS week, COUNT(*) AS count
		FROM incidents
		WHERE organization_id=$1 AND created_at >= NOW() - INTERVAL '12 weeks'
		GROUP BY week ORDER BY week ASC`
	rows, err := r.db.QueryContext(ctx, q, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var points []*entity.WeeklyTrendPoint
	for rows.Next() {
		p := &entity.WeeklyTrendPoint{}
		if err := rows.Scan(&p.Week, &p.Count); err != nil {
			return nil, err
		}
		points = append(points, p)
	}
	return points, rows.Err()
}

func (r *IncidentRepository) GetRecent(ctx context.Context, orgID string, limit int) ([]*entity.Incident, error) {
	const q = `SELECT id, organization_id, form_id, reported_by_user_id, data, status, created_at, updated_at
		FROM incidents WHERE organization_id=$1 ORDER BY created_at DESC LIMIT $2`
	rows, err := r.db.QueryContext(ctx, q, orgID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanIncidents(rows)
}

func (r *IncidentRepository) GetPending(ctx context.Context, orgID string) ([]*entity.Incident, error) {
	const q = `SELECT id, organization_id, form_id, reported_by_user_id, data, status, created_at, updated_at
		FROM incidents WHERE organization_id=$1 AND status='reported' ORDER BY created_at ASC`
	rows, err := r.db.QueryContext(ctx, q, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanIncidents(rows)
}

func scanIncidents(rows *sql.Rows) ([]*entity.Incident, error) {
	var incidents []*entity.Incident
	for rows.Next() {
		var i entity.Incident
		var dataJSON []byte
		if err := rows.Scan(&i.ID, &i.OrganizationID, &i.FormID, &i.ReportedByUserID, &dataJSON, &i.Status, &i.CreatedAt, &i.UpdatedAt); err != nil {
			return nil, err
		}
		if err := json.Unmarshal(dataJSON, &i.Data); err != nil {
			return nil, err
		}
		incidents = append(incidents, &i)
	}
	return incidents, rows.Err()
}

type AnonymousIncidentReportRepository struct {
	db *sql.DB
}

func NewAnonymousIncidentReportRepository(db *sql.DB) *AnonymousIncidentReportRepository {
	return &AnonymousIncidentReportRepository{db: db}
}

func (r *AnonymousIncidentReportRepository) FindAll(ctx context.Context, country, category *string) ([]*entity.AnonymousIncidentReport, error) {
	q := `SELECT id, incident_type_id, location, description, entities, injuries, fatalities, evidence_file_key, audio_file_key, created_at, updated_at
		FROM anonymous_incident_reports WHERE 1=1`
	args := []interface{}{}
	idx := 1
	if country != nil {
		q += fmt.Sprintf(" AND location->>'country' = $%d", idx)
		args = append(args, *country)
		idx++
	}
	if category != nil {
		q += fmt.Sprintf(" AND incident_type_id = (SELECT id FROM incident_types WHERE name = $%d LIMIT 1)", idx)
		args = append(args, *category)
	}
	q += " ORDER BY created_at DESC"
	rows, err := r.db.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanAnonReports(rows)
}

func (r *AnonymousIncidentReportRepository) FindByID(ctx context.Context, id string) (*entity.AnonymousIncidentReport, error) {
	const q = `SELECT id, incident_type_id, location, description, entities, injuries, fatalities, evidence_file_key, audio_file_key, created_at, updated_at
		FROM anonymous_incident_reports WHERE id=$1`
	rows, err := r.db.QueryContext(ctx, q, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	reports, err := scanAnonReports(rows)
	if err != nil || len(reports) == 0 {
		return nil, err
	}
	return reports[0], nil
}

func (r *AnonymousIncidentReportRepository) Create(ctx context.Context, report *entity.AnonymousIncidentReport) error {
	if report.ID == "" {
		report.ID = uuid.NewString()
	}
	locJSON, err := json.Marshal(report.Location)
	if err != nil {
		return err
	}
	entitiesJSON, err := json.Marshal(report.Entities)
	if err != nil {
		return err
	}
	now := time.Now()
	_, err = r.db.ExecContext(ctx,
		`INSERT INTO anonymous_incident_reports
		(id, incident_type_id, location, description, entities, injuries, fatalities, evidence_file_key, audio_file_key, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
		report.ID, report.IncidentTypeID, locJSON, report.Description, string(entitiesJSON),
		report.Injuries, report.Fatalities, report.EvidenceFileKey, report.AudioFileKey, now, now)
	return err
}

func (r *AnonymousIncidentReportRepository) GetHeatmapData(ctx context.Context) ([]*entity.HeatmapPoint, error) {
	const q = `
		SELECT (location->>'latitude')::float, (location->>'longitude')::float, COUNT(*) as weight
		FROM anonymous_incident_reports
		GROUP BY location->>'latitude', location->>'longitude'`
	rows, err := r.db.QueryContext(ctx, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var points []*entity.HeatmapPoint
	for rows.Next() {
		p := &entity.HeatmapPoint{}
		if err := rows.Scan(&p.Latitude, &p.Longitude, &p.Weight); err != nil {
			return nil, err
		}
		points = append(points, p)
	}
	return points, rows.Err()
}

func scanAnonReports(rows *sql.Rows) ([]*entity.AnonymousIncidentReport, error) {
	var reports []*entity.AnonymousIncidentReport
	for rows.Next() {
		var r entity.AnonymousIncidentReport
		var locJSON []byte
		var entitiesStr, evidKey, audKey sql.NullString
		if err := rows.Scan(&r.ID, &r.IncidentTypeID, &locJSON, &r.Description, &entitiesStr,
			&r.Injuries, &r.Fatalities, &evidKey, &audKey, &r.CreatedAt, &r.UpdatedAt); err != nil {
			return nil, err
		}
		if err := json.Unmarshal(locJSON, &r.Location); err != nil {
			return nil, err
		}
		if entitiesStr.Valid && entitiesStr.String != "" {
			_ = json.Unmarshal([]byte(entitiesStr.String), &r.Entities)
		}
		if evidKey.Valid {
			r.EvidenceFileKey = &evidKey.String
		}
		if audKey.Valid {
			r.AudioFileKey = &audKey.String
		}
		reports = append(reports, &r)
	}
	return reports, rows.Err()
}

type OrganizationIncidentReportRepository struct {
	db *sql.DB
}

func NewOrganizationIncidentReportRepository(db *sql.DB) *OrganizationIncidentReportRepository {
	return &OrganizationIncidentReportRepository{db: db}
}

func (r *OrganizationIncidentReportRepository) FindByOrganizationID(ctx context.Context, orgID string, params entity.ListParams) ([]*entity.OrganizationIncidentReport, int, error) {
	var total int
	if err := r.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM organization_incident_reports WHERE organization_id=$1", orgID).Scan(&total); err != nil {
		return nil, 0, err
	}
	const q = `SELECT id, organization_id, reported_by_user_id, incident_type_id, location, description,
		entities, injuries, fatalities, evidence_file_key, audio_file_key, severity, verified,
		verified_at, verified_by_user_id, created_at, updated_at
		FROM organization_incident_reports WHERE organization_id=$1
		ORDER BY created_at DESC LIMIT $2 OFFSET $3`
	rows, err := r.db.QueryContext(ctx, q, orgID, params.Limit, params.Offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	reports, err := scanOrgReports(rows)
	return reports, total, err
}

func (r *OrganizationIncidentReportRepository) FindByUserID(ctx context.Context, userID, orgID string, params entity.ListParams) ([]*entity.OrganizationIncidentReport, int, error) {
	var total int
	if err := r.db.QueryRowContext(ctx,
		"SELECT COUNT(*) FROM organization_incident_reports WHERE organization_id=$1 AND reported_by_user_id=$2",
		orgID, userID).Scan(&total); err != nil {
		return nil, 0, err
	}
	const q = `SELECT id, organization_id, reported_by_user_id, incident_type_id, location, description,
		entities, injuries, fatalities, evidence_file_key, audio_file_key, severity, verified,
		verified_at, verified_by_user_id, created_at, updated_at
		FROM organization_incident_reports WHERE organization_id=$1 AND reported_by_user_id=$2
		ORDER BY created_at DESC LIMIT $3 OFFSET $4`
	rows, err := r.db.QueryContext(ctx, q, orgID, userID, params.Limit, params.Offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	reports, err := scanOrgReports(rows)
	return reports, total, err
}

func (r *OrganizationIncidentReportRepository) FindByID(ctx context.Context, id string) (*entity.OrganizationIncidentReport, error) {
	const q = `SELECT id, organization_id, reported_by_user_id, incident_type_id, location, description,
		entities, injuries, fatalities, evidence_file_key, audio_file_key, severity, verified,
		verified_at, verified_by_user_id, created_at, updated_at
		FROM organization_incident_reports WHERE id=$1`
	rows, err := r.db.QueryContext(ctx, q, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	reports, err := scanOrgReports(rows)
	if err != nil || len(reports) == 0 {
		return nil, err
	}
	return reports[0], nil
}

func (r *OrganizationIncidentReportRepository) Create(ctx context.Context, report *entity.OrganizationIncidentReport) error {
	if report.ID == "" {
		report.ID = uuid.NewString()
	}
	locJSON, err := json.Marshal(report.Location)
	if err != nil {
		return err
	}
	entitiesJSON, err := json.Marshal(report.Entities)
	if err != nil {
		return err
	}
	now := time.Now()
	_, err = r.db.ExecContext(ctx,
		`INSERT INTO organization_incident_reports
		(id, organization_id, reported_by_user_id, incident_type_id, location, description, entities,
		injuries, fatalities, evidence_file_key, audio_file_key, severity, verified, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
		report.ID, report.OrganizationID, report.ReportedByUserID, report.IncidentTypeID, locJSON,
		report.Description, string(entitiesJSON), report.Injuries, report.Fatalities,
		report.EvidenceFileKey, report.AudioFileKey, string(report.Severity), report.Verified, now, now)
	return err
}

func (r *OrganizationIncidentReportRepository) GetStats(ctx context.Context, orgID string) (*entity.IncidentStats, error) {
	const q = `
		SELECT COUNT(*),
			SUM(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END),
			SUM(CASE WHEN created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END)
		FROM organization_incident_reports WHERE organization_id=$1`
	var s entity.IncidentStats
	err := r.db.QueryRowContext(ctx, q, orgID).Scan(&s.Total, &s.ThisWeek, &s.LastWeek)
	return &s, err
}

func scanOrgReports(rows *sql.Rows) ([]*entity.OrganizationIncidentReport, error) {
	var reports []*entity.OrganizationIncidentReport
	for rows.Next() {
		var r entity.OrganizationIncidentReport
		var locJSON []byte
		var entitiesStr, evidKey, audKey, verifiedByID sql.NullString
		var verifiedAt sql.NullTime
		if err := rows.Scan(&r.ID, &r.OrganizationID, &r.ReportedByUserID, &r.IncidentTypeID, &locJSON,
			&r.Description, &entitiesStr, &r.Injuries, &r.Fatalities,
			&evidKey, &audKey, &r.Severity, &r.Verified,
			&verifiedAt, &verifiedByID, &r.CreatedAt, &r.UpdatedAt); err != nil {
			return nil, err
		}
		if err := json.Unmarshal(locJSON, &r.Location); err != nil {
			return nil, err
		}
		if entitiesStr.Valid && entitiesStr.String != "" {
			_ = json.Unmarshal([]byte(entitiesStr.String), &r.Entities)
		}
		if evidKey.Valid {
			r.EvidenceFileKey = &evidKey.String
		}
		if audKey.Valid {
			r.AudioFileKey = &audKey.String
		}
		if verifiedByID.Valid {
			r.VerifiedByUserID = &verifiedByID.String
		}
		if verifiedAt.Valid {
			r.VerifiedAt = &verifiedAt.Time
		}
		reports = append(reports, &r)
	}
	return reports, rows.Err()
}
