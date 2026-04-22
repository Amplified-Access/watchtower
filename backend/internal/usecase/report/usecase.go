package reportusecase

import (
	"context"

	"backend/internal/domain/entity"
	domainerrors "backend/internal/domain/errors"
	"backend/internal/domain/repository"
)

type UseCase struct {
	repo repository.ReportRepository
}

func New(repo repository.ReportRepository) *UseCase {
	return &UseCase{repo: repo}
}

func (uc *UseCase) GetPublicReports(ctx context.Context, params entity.ListParams) ([]*entity.Report, int, error) {
	return uc.repo.FindPublic(ctx, params)
}

func (uc *UseCase) GetPublicReportByID(ctx context.Context, id string) (*entity.Report, error) {
	r, err := uc.repo.FindPublicByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if r == nil {
		return nil, domainerrors.NewNotFound("report not found")
	}
	return r, nil
}

func (uc *UseCase) GetOrganizationReports(ctx context.Context, orgID string, status *entity.ReportStatus) ([]*entity.Report, error) {
	return uc.repo.FindByOrganizationID(ctx, orgID, status)
}

func (uc *UseCase) GetReportByID(ctx context.Context, id string) (*entity.Report, error) {
	r, err := uc.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if r == nil {
		return nil, domainerrors.NewNotFound("report not found")
	}
	return r, nil
}

func (uc *UseCase) CreateReport(ctx context.Context, report *entity.Report) error {
	return uc.repo.Create(ctx, report)
}

func (uc *UseCase) UpdateReport(ctx context.Context, report *entity.Report) error {
	return uc.repo.Update(ctx, report)
}

func (uc *UseCase) DeleteReport(ctx context.Context, id string) error {
	return uc.repo.Delete(ctx, id)
}

func (uc *UseCase) GetAllReports(ctx context.Context, params entity.ListParams) ([]*entity.Report, int, error) {
	return uc.repo.FindAllForSuperAdmin(ctx, params)
}
