package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"time"

	"github.com/google/uuid"

	"backend/internal/domain/entity"
)

type AlertSubscriptionRepository struct {
	db *sql.DB
}

func NewAlertSubscriptionRepository(db *sql.DB) *AlertSubscriptionRepository {
	return &AlertSubscriptionRepository{db: db}
}

const alertCols = `id, email, name, phone, incident_types, locations, severity_levels,
	email_notifications, sms_notifications, alert_frequency, is_active,
	preferred_language, timezone, created_at, updated_at`

func (r *AlertSubscriptionRepository) FindByEmail(ctx context.Context, email string) ([]*entity.AlertSubscription, error) {
	q := "SELECT " + alertCols + " FROM alert_subscriptions WHERE email=$1 ORDER BY created_at DESC"
	rows, err := r.db.QueryContext(ctx, q, email)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanAlertSubscriptions(rows)
}

func (r *AlertSubscriptionRepository) FindAllActive(ctx context.Context) ([]*entity.AlertSubscription, error) {
	q := "SELECT " + alertCols + " FROM alert_subscriptions WHERE is_active=true ORDER BY created_at DESC"
	rows, err := r.db.QueryContext(ctx, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanAlertSubscriptions(rows)
}

func (r *AlertSubscriptionRepository) Create(ctx context.Context, sub *entity.AlertSubscription) error {
	if sub.ID == "" {
		sub.ID = uuid.NewString()
	}
	incTypesJSON, err := json.Marshal(sub.IncidentTypes)
	if err != nil {
		return err
	}
	locsJSON, err := json.Marshal(sub.Locations)
	if err != nil {
		return err
	}
	sevJSON, err := json.Marshal(sub.SeverityLevels)
	if err != nil {
		return err
	}
	now := time.Now()
	_, err = r.db.ExecContext(ctx,
		`INSERT INTO alert_subscriptions
		(id, email, name, phone, incident_types, locations, severity_levels,
		email_notifications, sms_notifications, alert_frequency, is_active,
		preferred_language, timezone, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
		sub.ID, sub.Email, sub.Name, sub.Phone, incTypesJSON, locsJSON, sevJSON,
		sub.EmailNotifications, sub.SMSNotifications, string(sub.AlertFrequency), sub.IsActive,
		sub.PreferredLanguage, sub.Timezone, now, now)
	return err
}

func (r *AlertSubscriptionRepository) Update(ctx context.Context, sub *entity.AlertSubscription) error {
	incTypesJSON, err := json.Marshal(sub.IncidentTypes)
	if err != nil {
		return err
	}
	locsJSON, err := json.Marshal(sub.Locations)
	if err != nil {
		return err
	}
	sevJSON, err := json.Marshal(sub.SeverityLevels)
	if err != nil {
		return err
	}
	_, err = r.db.ExecContext(ctx,
		`UPDATE alert_subscriptions SET incident_types=$1, locations=$2, severity_levels=$3,
		email_notifications=$4, sms_notifications=$5, alert_frequency=$6,
		preferred_language=$7, timezone=$8, updated_at=$9 WHERE id=$10`,
		incTypesJSON, locsJSON, sevJSON,
		sub.EmailNotifications, sub.SMSNotifications, string(sub.AlertFrequency),
		sub.PreferredLanguage, sub.Timezone, time.Now(), sub.ID)
	return err
}

func (r *AlertSubscriptionRepository) UpdateStatus(ctx context.Context, id string, isActive bool) error {
	_, err := r.db.ExecContext(ctx,
		"UPDATE alert_subscriptions SET is_active=$1, updated_at=$2 WHERE id=$3",
		isActive, time.Now(), id)
	return err
}

func (r *AlertSubscriptionRepository) GetStats(ctx context.Context) (*entity.AlertStats, error) {
	const q = `SELECT COUNT(*),
		SUM(CASE WHEN is_active THEN 1 ELSE 0 END),
		SUM(CASE WHEN NOT is_active THEN 1 ELSE 0 END)
		FROM alert_subscriptions`
	var s entity.AlertStats
	err := r.db.QueryRowContext(ctx, q).Scan(&s.Total, &s.Active, &s.Inactive)
	return &s, err
}

func scanAlertSubscriptions(rows *sql.Rows) ([]*entity.AlertSubscription, error) {
	var subs []*entity.AlertSubscription
	for rows.Next() {
		var s entity.AlertSubscription
		var name, phone sql.NullString
		var incTypesJSON, locsJSON, sevJSON []byte
		var freq sql.NullString
		if err := rows.Scan(&s.ID, &s.Email, &name, &phone,
			&incTypesJSON, &locsJSON, &sevJSON,
			&s.EmailNotifications, &s.SMSNotifications, &freq, &s.IsActive,
			&s.PreferredLanguage, &s.Timezone, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, err
		}
		if name.Valid {
			s.Name = &name.String
		}
		if phone.Valid {
			s.Phone = &phone.String
		}
		if freq.Valid {
			s.AlertFrequency = entity.AlertFrequency(freq.String)
		}
		_ = json.Unmarshal(incTypesJSON, &s.IncidentTypes)
		_ = json.Unmarshal(locsJSON, &s.Locations)
		_ = json.Unmarshal(sevJSON, &s.SeverityLevels)
		subs = append(subs, &s)
	}
	return subs, rows.Err()
}
