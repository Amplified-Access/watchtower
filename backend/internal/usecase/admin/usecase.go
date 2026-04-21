package adminusecase

import (
	"context"

	"backend/internal/domain/entity"
	"backend/internal/domain/repository"
)

type UseCase struct {
	userRepo    repository.UserRepository
	incidentRepo repository.IncidentRepository
	formRepo    repository.FormRepository
}

func New(
	userRepo repository.UserRepository,
	incidentRepo repository.IncidentRepository,
	formRepo repository.FormRepository,
) *UseCase {
	return &UseCase{
		userRepo:    userRepo,
		incidentRepo: incidentRepo,
		formRepo:    formRepo,
	}
}

func (uc *UseCase) GetOrganizationWatchers(ctx context.Context) ([]*entity.User, error) {
	role := entity.RoleWatcher
	return uc.userRepo.FindAll(ctx, &role)
}

func (uc *UseCase) GetAllAdmins(ctx context.Context) ([]*entity.User, error) {
	role := entity.RoleAdmin
	return uc.userRepo.FindAll(ctx, &role)
}

func (uc *UseCase) GetOrganizationForms(ctx context.Context, orgID string) ([]*entity.Form, error) {
	return uc.formRepo.FindByOrganizationID(ctx, orgID)
}

func (uc *UseCase) GetActiveFormsForWatcher(ctx context.Context, orgID string) ([]*entity.Form, error) {
	return uc.formRepo.FindActiveByOrganizationID(ctx, orgID)
}

func (uc *UseCase) SaveForm(ctx context.Context, form *entity.Form) error {
	return uc.formRepo.Create(ctx, form)
}

func (uc *UseCase) GetFormByID(ctx context.Context, id string) (*entity.Form, error) {
	return uc.formRepo.FindByID(ctx, id)
}

func (uc *UseCase) UpdateForm(ctx context.Context, form *entity.Form) error {
	return uc.formRepo.Update(ctx, form)
}

func (uc *UseCase) DeleteForm(ctx context.Context, id string) error {
	return uc.formRepo.Delete(ctx, id)
}

func (uc *UseCase) GetDashboardStats(ctx context.Context, orgID string) (*entity.IncidentStats, error) {
	return uc.incidentRepo.GetStats(ctx, orgID)
}

func (uc *UseCase) GetWeeklyTrend(ctx context.Context, orgID string) ([]*entity.WeeklyTrendPoint, error) {
	return uc.incidentRepo.GetWeeklyTrend(ctx, orgID)
}

func (uc *UseCase) GetAllFormsForSuperAdmin(ctx context.Context, params entity.ListParams) ([]*entity.Form, int, error) {
	return uc.formRepo.FindAllForSuperAdmin(ctx, params)
}
