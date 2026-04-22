package postgres

import (
	"context"
	"database/sql"
	"time"

	"backend/internal/domain/entity"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) FindByID(ctx context.Context, id string) (*entity.User, error) {
	const q = `
		SELECT id, name, email, email_verified, image, created_at, updated_at,
		       role, banned, ban_reason, ban_expires, organization_id
		FROM "user" WHERE id = $1`
	row := r.db.QueryRowContext(ctx, q, id)
	return scanUser(row)
}

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*entity.User, error) {
	const q = `
		SELECT id, name, email, email_verified, image, created_at, updated_at,
		       role, banned, ban_reason, ban_expires, organization_id
		FROM "user" WHERE email = $1`
	row := r.db.QueryRowContext(ctx, q, email)
	return scanUser(row)
}

func (r *UserRepository) FindAll(ctx context.Context, role *entity.UserRole) ([]*entity.User, error) {
	q := `
		SELECT id, name, email, email_verified, image, created_at, updated_at,
		       role, banned, ban_reason, ban_expires, organization_id
		FROM "user"`
	args := []interface{}{}
	if role != nil {
		q += " WHERE role = $1"
		args = append(args, string(*role))
	}
	q += " ORDER BY created_at DESC"
	rows, err := r.db.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanUsers(rows)
}

func (r *UserRepository) Update(ctx context.Context, u *entity.User) error {
	const q = `
		UPDATE "user" SET name=$1, role=$2, banned=$3, ban_reason=$4, ban_expires=$5, updated_at=$6
		WHERE id=$7`
	_, err := r.db.ExecContext(ctx, q, u.Name, string(u.Role), u.Banned, u.BanReason, u.BanExpires, time.Now(), u.ID)
	return err
}

func (r *UserRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM "user" WHERE id=$1`, id)
	return err
}

func scanUser(row *sql.Row) (*entity.User, error) {
	var u entity.User
	var roleStr sql.NullString
	var orgID sql.NullString
	var banReason sql.NullString
	var banExpires sql.NullTime
	var image sql.NullString
	err := row.Scan(
		&u.ID, &u.Name, &u.Email, &u.EmailVerified, &image,
		&u.CreatedAt, &u.UpdatedAt,
		&roleStr, &u.Banned, &banReason, &banExpires, &orgID,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if roleStr.Valid {
		u.Role = entity.UserRole(roleStr.String)
	}
	if orgID.Valid {
		u.OrganizationID = &orgID.String
	}
	if banReason.Valid {
		u.BanReason = &banReason.String
	}
	if banExpires.Valid {
		u.BanExpires = &banExpires.Time
	}
	if image.Valid {
		u.Image = &image.String
	}
	return &u, nil
}

func scanUsers(rows *sql.Rows) ([]*entity.User, error) {
	var users []*entity.User
	for rows.Next() {
		var u entity.User
		var roleStr sql.NullString
		var orgID, banReason, image sql.NullString
		var banExpires sql.NullTime
		err := rows.Scan(
			&u.ID, &u.Name, &u.Email, &u.EmailVerified, &image,
			&u.CreatedAt, &u.UpdatedAt,
			&roleStr, &u.Banned, &banReason, &banExpires, &orgID,
		)
		if err != nil {
			return nil, err
		}
		if roleStr.Valid {
			u.Role = entity.UserRole(roleStr.String)
		}
		if orgID.Valid {
			u.OrganizationID = &orgID.String
		}
		if banReason.Valid {
			u.BanReason = &banReason.String
		}
		if banExpires.Valid {
			u.BanExpires = &banExpires.Time
		}
		if image.Valid {
			u.Image = &image.String
		}
		users = append(users, &u)
	}
	return users, rows.Err()
}

type SessionRepository struct {
	db *sql.DB
}

func NewSessionRepository(db *sql.DB) *SessionRepository {
	return &SessionRepository{db: db}
}

func (r *SessionRepository) FindByToken(ctx context.Context, token string) (*entity.Session, error) {
	const q = `
		SELECT id, expires_at, token, created_at, updated_at, ip_address, user_agent, user_id, impersonated_by
		FROM session WHERE token=$1`
	row := r.db.QueryRowContext(ctx, q, token)
	var s entity.Session
	var ipAddr, userAgent, impBy sql.NullString
	err := row.Scan(&s.ID, &s.ExpiresAt, &s.Token, &s.CreatedAt, &s.UpdatedAt,
		&ipAddr, &userAgent, &s.UserID, &impBy)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if ipAddr.Valid {
		s.IPAddress = &ipAddr.String
	}
	if userAgent.Valid {
		s.UserAgent = &userAgent.String
	}
	if impBy.Valid {
		s.ImpersonatedBy = &impBy.String
	}
	return &s, nil
}

func (r *SessionRepository) FindUserByToken(ctx context.Context, token string) (*entity.User, error) {
	const q = `
		SELECT u.id, u.name, u.email, u.email_verified, u.image, u.created_at, u.updated_at,
		       u.role, u.banned, u.ban_reason, u.ban_expires, u.organization_id
		FROM "user" u
		JOIN session s ON s.user_id = u.id
		WHERE s.token=$1 AND s.expires_at > NOW()`
	row := r.db.QueryRowContext(ctx, q, token)
	return scanUser(row)
}
