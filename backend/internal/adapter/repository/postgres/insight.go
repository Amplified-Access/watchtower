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

type InsightRepository struct {
	db *sql.DB
}

func NewInsightRepository(db *sql.DB) *InsightRepository {
	return &InsightRepository{db: db}
}

func (r *InsightRepository) FindPublic(ctx context.Context, params entity.ListParams, tags []string) ([]*entity.Insight, int, error) {
	where := "i.status='published'"
	args := []interface{}{}
	idx := 1
	if params.Search != "" {
		where += fmt.Sprintf(" AND (i.title ILIKE $%d OR i.description ILIKE $%d)", idx, idx+1)
		like := "%" + params.Search + "%"
		args = append(args, like, like)
		idx += 2
	}
	if len(tags) > 0 {
		where += fmt.Sprintf(" AND EXISTS (SELECT 1 FROM insight_tag_relations itr JOIN insight_tags it ON it.id=itr.tag_id WHERE itr.insight_id=i.id AND it.slug=ANY($%d))", idx)
		args = append(args, tags)
		idx++
	}
	var total int
	if err := r.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM insights i WHERE "+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}
	args = append(args, params.Limit, params.Offset)
	q := fmt.Sprintf(`SELECT i.id, i.title, i.slug, i.description, i.content, i.author_id, i.organization_id,
		i.image_url, i.image_alt, i.status, i.published_at, i.created_at, i.updated_at
		FROM insights i WHERE %s ORDER BY i.published_at DESC LIMIT $%d OFFSET $%d`, where, idx, idx+1)
	rows, err := r.db.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	insights, err := scanInsights(rows)
	return insights, total, err
}

func (r *InsightRepository) FindPublicBySlug(ctx context.Context, slug string) (*entity.Insight, error) {
	const q = `SELECT id, title, slug, description, content, author_id, organization_id,
		image_url, image_alt, status, published_at, created_at, updated_at
		FROM insights WHERE slug=$1 AND status='published'`
	rows, err := r.db.QueryContext(ctx, q, slug)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	insights, err := scanInsights(rows)
	if err != nil || len(insights) == 0 {
		return nil, err
	}
	insight := insights[0]
	tags, err := r.findTagsByInsightID(ctx, insight.ID)
	if err != nil {
		return nil, err
	}
	insight.Tags = tags
	return insight, nil
}

func (r *InsightRepository) FindAllTags(ctx context.Context) ([]*entity.InsightTag, error) {
	const q = `SELECT id, title, slug, created_at, updated_at FROM insight_tags ORDER BY title ASC`
	rows, err := r.db.QueryContext(ctx, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var tags []*entity.InsightTag
	for rows.Next() {
		t := &entity.InsightTag{}
		if err := rows.Scan(&t.ID, &t.Title, &t.Slug, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		tags = append(tags, t)
	}
	return tags, rows.Err()
}

func (r *InsightRepository) Create(ctx context.Context, insight *entity.Insight) error {
	if insight.ID == "" {
		insight.ID = uuid.NewString()
	}
	var contentJSON []byte
	var err error
	if insight.Content != nil {
		contentJSON, err = json.Marshal(insight.Content)
		if err != nil {
			return err
		}
	}
	now := time.Now()
	_, err = r.db.ExecContext(ctx,
		`INSERT INTO insights (id, title, slug, description, content, author_id, organization_id,
		image_url, image_alt, status, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
		insight.ID, insight.Title, insight.Slug, insight.Description, contentJSON,
		insight.AuthorID, insight.OrganizationID, insight.ImageURL, insight.ImageAlt,
		string(insight.Status), now, now)
	if err != nil {
		return err
	}
	for _, tag := range insight.Tags {
		if tag.ID == "" {
			continue
		}
		_, _ = r.db.ExecContext(ctx,
			`INSERT INTO insight_tag_relations (id, insight_id, tag_id, created_at) VALUES ($1,$2,$3,$4)`,
			uuid.NewString(), insight.ID, tag.ID, now)
	}
	return nil
}

func (r *InsightRepository) findTagsByInsightID(ctx context.Context, insightID string) ([]entity.InsightTag, error) {
	const q = `SELECT t.id, t.title, t.slug, t.created_at, t.updated_at
		FROM insight_tags t
		JOIN insight_tag_relations r ON r.tag_id=t.id
		WHERE r.insight_id=$1`
	rows, err := r.db.QueryContext(ctx, q, insightID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var tags []entity.InsightTag
	for rows.Next() {
		var t entity.InsightTag
		if err := rows.Scan(&t.ID, &t.Title, &t.Slug, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		tags = append(tags, t)
	}
	return tags, rows.Err()
}

func scanInsights(rows *sql.Rows) ([]*entity.Insight, error) {
	var insights []*entity.Insight
	for rows.Next() {
		var i entity.Insight
		var contentJSON []byte
		var orgID, imageURL, imageAlt sql.NullString
		var publishedAt sql.NullTime
		if err := rows.Scan(&i.ID, &i.Title, &i.Slug, &i.Description, &contentJSON,
			&i.AuthorID, &orgID, &imageURL, &imageAlt, &i.Status, &publishedAt, &i.CreatedAt, &i.UpdatedAt); err != nil {
			return nil, err
		}
		if len(contentJSON) > 0 {
			_ = json.Unmarshal(contentJSON, &i.Content)
		}
		if orgID.Valid {
			i.OrganizationID = &orgID.String
		}
		if imageURL.Valid {
			i.ImageURL = &imageURL.String
		}
		if imageAlt.Valid {
			i.ImageAlt = &imageAlt.String
		}
		if publishedAt.Valid {
			i.PublishedAt = &publishedAt.Time
		}
		insights = append(insights, &i)
	}
	return insights, rows.Err()
}
