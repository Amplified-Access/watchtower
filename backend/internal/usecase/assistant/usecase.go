package assistantusecase

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"backend/internal/domain/entity"
	domainerrors "backend/internal/domain/errors"
	"backend/internal/domain/repository"
)

// Search settings carried over from the frontend's original query.
const (
	minSimilarity  = 0.5
	maxMatches     = 4
	maxQuestionLen = 1000
)

// Embedder turns text into a vector in the same space as the stored
// knowledge-base embeddings.
type Embedder interface {
	Embed(ctx context.Context, text string) ([]float32, error)
}

// ErrUnavailable means the embedding service isn't configured.
var ErrUnavailable = errors.New("knowledge search is unavailable")

type UseCase struct {
	embedder  Embedder
	knowledge repository.KnowledgeRepository
}

func New(embedder Embedder, knowledge repository.KnowledgeRepository) *UseCase {
	return &UseCase{embedder: embedder, knowledge: knowledge}
}

// SearchKnowledge returns the knowledge-base passages closest to a question,
// for the chat assistant to answer from.
func (uc *UseCase) SearchKnowledge(ctx context.Context, question string) ([]*entity.KnowledgeMatch, error) {
	// The frontend replaced escaped "\n" sequences with spaces before
	// embedding; keep doing the same so queries embed identically.
	question = strings.TrimSpace(strings.ReplaceAll(question, `\n`, " "))
	if question == "" {
		return nil, domainerrors.NewBadRequest("question is required")
	}
	if len(question) > maxQuestionLen {
		return nil, domainerrors.NewBadRequest("question is too long")
	}

	vector, err := uc.embedder.Embed(ctx, question)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrUnavailable, err)
	}
	return uc.knowledge.Search(ctx, vector, minSimilarity, maxMatches)
}
