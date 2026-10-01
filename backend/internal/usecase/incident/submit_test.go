package incidentusecase

import (
	"context"
	"errors"
	"testing"

	"backend/internal/domain/entity"
	domainerrors "backend/internal/domain/errors"
)

type mockCreateRepo struct {
	mockAnonRepo
	created *entity.AnonymousIncidentReport
}

func (m *mockCreateRepo) Create(_ context.Context, r *entity.AnonymousIncidentReport) error {
	m.created = r
	return nil
}

func TestSubmitAnonymousReport_NeedsADescriptionOrAVoiceNote(t *testing.T) {
	cases := []struct {
		name        string
		description string
		audio       *string
		wantErr     bool
	}{
		{"description only", "Water point closed since Monday", nil, false},
		{"voice note only", "", strPtr("audio/voice-note.webm"), false},
		{"both", "Water point closed", strPtr("audio/voice-note.webm"), false},
		{"neither", "", nil, true},
		{"blank description, empty audio key", "   ", strPtr(" "), true},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			repo := &mockCreateRepo{}
			err := New(nil, nil, repo, nil).SubmitAnonymousReport(context.Background(),
				&entity.AnonymousIncidentReport{Description: tc.description, AudioFileKey: tc.audio})
			if tc.wantErr {
				if !errors.Is(err, domainerrors.ErrBadRequest) {
					t.Fatalf("want a bad request, got %v", err)
				}
				if repo.created != nil {
					t.Fatal("a report with neither was saved")
				}
				return
			}
			if err != nil || repo.created == nil {
				t.Fatalf("want the report saved, got err %v", err)
			}
		})
	}
}

func TestSubmitAnonymousReport_TrimsTheDescription(t *testing.T) {
	repo := &mockCreateRepo{}
	_ = New(nil, nil, repo, nil).SubmitAnonymousReport(context.Background(),
		&entity.AnonymousIncidentReport{Description: "  Road blocked \n"})
	if repo.created.Description != "Road blocked" {
		t.Fatalf("got %q", repo.created.Description)
	}
}
