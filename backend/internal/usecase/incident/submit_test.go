package incidentusecase

import (
	"context"
	"errors"
	"testing"
	"time"

	"backend/internal/domain/entity"
	domainerrors "backend/internal/domain/errors"
	"backend/internal/domain/repository"
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
			err := New(nil, nil, repo, nil, nil).SubmitAnonymousReport(context.Background(),
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
	_ = New(nil, nil, repo, nil, nil).SubmitAnonymousReport(context.Background(),
		&entity.AnonymousIncidentReport{Description: "  Road blocked \n"})
	if repo.created.Description != "Road blocked" {
		t.Fatalf("got %q", repo.created.Description)
	}
}

// mockDeploymentRepo returns one deployment for FindByID; the rest of the
// interface isn't used by SubmitAnonymousReport.
type mockDeploymentRepo struct {
	repository.DeploymentRepository
	d *entity.Deployment
}

func (m *mockDeploymentRepo) FindByID(_ context.Context, _ string) (*entity.Deployment, error) {
	return m.d, nil
}

func TestSubmitAnonymousReport_ThroughADeployment(t *testing.T) {
	yesterday := time.Now().AddDate(0, 0, -2)
	live := func() *entity.Deployment {
		return &entity.Deployment{
			Status:        entity.DeploymentLive,
			IncidentTypes: []entity.IncidentType{{ID: "flooding"}},
		}
	}
	cases := []struct {
		name       string
		deployment *entity.Deployment
		typeID     string
		wantSaved  bool
	}{
		{"live, tracked type", live(), "flooding", true},
		{"unknown deployment", nil, "flooding", false},
		{"draft", func() *entity.Deployment { d := live(); d.Status = entity.DeploymentDraft; return d }(), "flooding", false},
		{"closed", func() *entity.Deployment { d := live(); d.Status = entity.DeploymentClosed; return d }(), "flooding", false},
		{"past its end date", func() *entity.Deployment { d := live(); d.EndsAt = &yesterday; return d }(), "flooding", false},
		{"type it doesn't track", live(), "drought", false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			repo := &mockCreateRepo{}
			uc := New(nil, nil, repo, nil, &mockDeploymentRepo{d: tc.deployment})
			err := uc.SubmitAnonymousReport(context.Background(), &entity.AnonymousIncidentReport{
				Description:    "Bridge washed away",
				IncidentTypeID: tc.typeID,
				DeploymentID:   strPtr("d1"),
			})
			if tc.wantSaved {
				if err != nil || repo.created == nil {
					t.Fatalf("want saved, got %v", err)
				}
				return
			}
			if !errors.Is(err, domainerrors.ErrBadRequest) || repo.created != nil {
				t.Fatalf("want a bad request and nothing saved, got %v (saved: %v)", err, repo.created != nil)
			}
		})
	}
}
