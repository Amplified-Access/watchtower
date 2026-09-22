package postgres

import (
	"context"
	"database/sql"
	"strconv"
	"strings"

	"backend/internal/domain/entity"
)

type KnowledgeRepository struct {
	db *sql.DB
}

func NewKnowledgeRepository(db *sql.DB) *KnowledgeRepository {
	return &KnowledgeRepository{db: db}
}

// Search uses pgvector's cosine distance operator (<=>); similarity is
// 1 - distance, the same measure the frontend's Drizzle query used.
func (r *KnowledgeRepository) Search(ctx context.Context, embedding []float32, minSimilarity float64, limit int) ([]*entity.KnowledgeMatch, error) {
	const q = `
		SELECT content, 1 - (embedding <=> $1::vector) AS similarity
		FROM embedding
		WHERE 1 - (embedding <=> $1::vector) > $2
		ORDER BY similarity DESC
		LIMIT $3`
	rows, err := r.db.QueryContext(ctx, q, vectorLiteral(embedding), minSimilarity, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	matches := []*entity.KnowledgeMatch{}
	for rows.Next() {
		m := &entity.KnowledgeMatch{}
		if err := rows.Scan(&m.Content, &m.Similarity); err != nil {
			return nil, err
		}
		matches = append(matches, m)
	}
	return matches, rows.Err()
}

// vectorLiteral formats a vector as pgvector's text input, "[0.1,0.2,...]",
// so the query doesn't depend on driver support for the vector type.
func vectorLiteral(v []float32) string {
	var b strings.Builder
	b.Grow(len(v) * 12)
	b.WriteByte('[')
	for i, f := range v {
		if i > 0 {
			b.WriteByte(',')
		}
		b.WriteString(strconv.FormatFloat(float64(f), 'g', -1, 32))
	}
	b.WriteByte(']')
	return b.String()
}
