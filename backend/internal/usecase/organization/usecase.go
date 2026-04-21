package organizationusecase

import (
	"context"

	"backend/internal/domain/entity"
	domainerrors "backend/internal/domain/errors"
	"backend/internal/domain/repository"
)

type UseCase struct {
	orgRepo repository.OrganizationRepository
	appRepo repository.OrganizationApplicationRepository
}

func New(
	orgRepo repository.OrganizationRepository,
	appRepo repository.OrganizationApplicationRepository,
) *UseCase {
	return &UseCase{orgRepo: orgRepo, appRepo: appRepo}
}

func (uc *UseCase) GetAll(ctx context.Context, params entity.ListParams) ([]*entity.Organization, int, error) {
	return uc.orgRepo.FindAll(ctx, params)
}

func (uc *UseCase) GetBySlug(ctx context.Context, slug string) (*entity.Organization, error) {
	org, err := uc.orgRepo.FindBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}
	if org == nil {
		return nil, domainerrors.NewNotFound("organization not found")
	}
	return org, nil
}

func (uc *UseCase) SubmitApplication(ctx context.Context, app *entity.OrganizationApplication) error {
	return uc.appRepo.Create(ctx, app)
}

func (uc *UseCase) GetApplications(ctx context.Context) ([]*entity.OrganizationApplication, error) {
	return uc.appRepo.FindAll(ctx)
}

func (uc *UseCase) ApproveApplication(ctx context.Context, id int) error {
	app, err := uc.appRepo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if app == nil {
		return domainerrors.NewNotFound("application not found")
	}
	if app.Status != entity.ApplicationPending {
		return domainerrors.NewBadRequest("application is not pending")
	}
	return uc.appRepo.UpdateStatus(ctx, id, entity.ApplicationApproved)
}

func (uc *UseCase) DeclineApplication(ctx context.Context, id int) error {
	app, err := uc.appRepo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if app == nil {
		return domainerrors.NewNotFound("application not found")
	}
	return uc.appRepo.UpdateStatus(ctx, id, entity.ApplicationDeclined)
}
