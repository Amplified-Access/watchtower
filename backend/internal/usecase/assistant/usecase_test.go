package assistantusecase

import (
	"context"
	"errors"
	"strings"
	"testing"

	"backend/internal/domain/entity"
	domainerrors "backend/internal/domain/errors"
)

type fakeEmbedder struct {
	got string
	err error
}

func (f *fakeEmbedder) Embed(_ context.Context, text string) ([]float32, error) {
	f.got = text
	return []float32{0.1, 0.2}, f.err
}

type fakeKnowledge struct {
	calls         int
	minSimilarity float64
	limit         int
}

func (f *fakeKnowledge) Search(_ context.Context, _ []float32, minSimilarity float64, limit int) ([]*entity.KnowledgeMatch, error) {
	f.calls++
	f.minSimilarity, f.limit = minSimilarity, limit
	return []*entity.KnowledgeMatch{{Content: "How to report", Similarity: 0.8}}, nil
}

func TestSearchKnowledge_EmbedsAndSearches(t *testing.T) {
	emb, kb := &fakeEmbedder{}, &fakeKnowledge{}
	matches, err := New(emb, kb).SearchKnowledge(context.Background(), `  how do I\nreport?  `)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if emb.got != "how do I report?" {
		t.Errorf("question should be trimmed with escaped newlines replaced, got %q", emb.got)
	}
	if kb.minSimilarity != 0.5 || kb.limit != 4 {
		t.Errorf("want the original 0.5 / 4 search settings, got %v / %d", kb.minSimilarity, kb.limit)
	}
	if len(matches) != 1 {
		t.Errorf("want the repository's matches, got %d", len(matches))
	}
}

func TestSearchKnowledge_RejectsBadQuestions(t *testing.T) {
	for name, q := range map[string]string{"empty": "   ", "too long": strings.Repeat("a", maxQuestionLen+1)} {
		t.Run(name, func(t *testing.T) {
			emb, kb := &fakeEmbedder{}, &fakeKnowledge{}
			_, err := New(emb, kb).SearchKnowledge(context.Background(), q)
			if !errors.Is(err, domainerrors.ErrBadRequest) {
				t.Fatalf("want bad request, got %v", err)
			}
			if emb.got != "" || kb.calls != 0 {
				t.Error("a rejected question must not spend an embedding request")
			}
		})
	}
}

func TestSearchKnowledge_EmbedderFailureIsUnavailable(t *testing.T) {
	kb := &fakeKnowledge{}
	_, err := New(&fakeEmbedder{err: errors.New("no key")}, kb).SearchKnowledge(context.Background(), "hello")
	if !errors.Is(err, ErrUnavailable) {
		t.Fatalf("want ErrUnavailable, got %v", err)
	}
	if kb.calls != 0 {
		t.Error("no search without an embedding")
	}
}
