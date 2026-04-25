package adminusecase

import (
	"context"

	"backend/internal/domain/entity"
	"backend/internal/domain/repository"
)

type UseCase struct {
	userRepo     repository.UserRepository
	incidentRepo repository.IncidentRepository
	formRepo     repository.FormRepository
	orgRepo      repository.OrganizationRepository
	appRepo      repository.OrganizationApplicationRepository
}

func New(
	userRepo repository.UserRepository,
	incidentRepo repository.IncidentRepository,
	formRepo repository.FormRepository,
	orgRepo repository.OrganizationRepository,
	appRepo repository.OrganizationApplicationRepository,
) *UseCase {
	return &UseCase{
		userRepo:     userRepo,
		incidentRepo: incidentRepo,
		formRepo:     formRepo,
		orgRepo:      orgRepo,
		appRepo:      appRepo,
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

func (uc *UseCase) GetPlatformStats(ctx context.Context) (*entity.PlatformStats, error) {
	_, orgTotal, err := uc.orgRepo.FindAll(ctx, entity.ListParams{Limit: 1})
	if err != nil {
		return nil, err
	}

	roleAdmin := entity.RoleAdmin
	admins, err := uc.userRepo.FindAll(ctx, &roleAdmin)
	if err != nil {
		return nil, err
	}
	roleSuperAdmin := entity.RoleSuperAdmin
	superAdmins, err := uc.userRepo.FindAll(ctx, &roleSuperAdmin)
	if err != nil {
		return nil, err
	}

	roleWatcher := entity.RoleWatcher
	watchers, err := uc.userRepo.FindAll(ctx, &roleWatcher)
	if err != nil {
		return nil, err
	}

	apps, err := uc.appRepo.FindAll(ctx)
	if err != nil {
		return nil, err
	}
	pending := 0
	for _, a := range apps {
		if a.Status == entity.ApplicationPending {
			pending++
		}
	}

	forms, _, err := uc.formRepo.FindAllForSuperAdmin(ctx, entity.ListParams{Limit: 1000})
	if err != nil {
		return nil, err
	}
	activeForms := 0
	for _, f := range forms {
		if f.IsActive {
			activeForms++
		}
	}

	return &entity.PlatformStats{
		TotalOrganizations:  orgTotal,
		TotalAdmins:         len(admins) + len(superAdmins),
		TotalWatchers:       len(watchers),
		PendingApplications: pending,
		ActiveForms:         activeForms,
		UptimePercentage:    99.9,
	}, nil
}

func (uc *UseCase) GetRecentActivity(ctx context.Context, limit int) ([]*entity.ActivityItem, error) {
	// This would fetch recent events from an audit log or multiple tables.
	return []*entity.ActivityItem{}, nil
}
