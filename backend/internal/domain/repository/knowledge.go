package repository

import (
	"context"

	"backend/internal/domain/entity"
)

// KnowledgeRepository searches the chat assistant's knowledge base, the
// embedded passages in the `embedding` table.
type KnowledgeRepository interface {
	// Search returns up to limit passages whose cosine similarity to the
	// query vector is above minSimilarity, most similar first.
	Search(ctx context.Context, embedding []float32, minSimilarity float64, limit int) ([]*entity.KnowledgeMatch, error)
}
