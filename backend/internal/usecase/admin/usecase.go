package adminusecase

import (
	"context"
	"math"
	"time"

	"backend/internal/domain/entity"
	"backend/internal/domain/repository"
)

type UseCase struct {
	userRepo      repository.UserRepository
	incidentRepo  repository.IncidentRepository
	formRepo      repository.FormRepository
	orgRepo       repository.OrganizationRepository
	appRepo       repository.OrganizationApplicationRepository
	orgReportRepo repository.OrganizationIncidentReportRepository
	anonRepo      repository.AnonymousIncidentReportRepository
	deploymentRepo repository.DeploymentRepository
}

func New(
	userRepo repository.UserRepository,
	incidentRepo repository.IncidentRepository,
	formRepo repository.FormRepository,
	orgRepo repository.OrganizationRepository,
	appRepo repository.OrganizationApplicationRepository,
	orgReportRepo repository.OrganizationIncidentReportRepository,
	anonRepo repository.AnonymousIncidentReportRepository,
	deploymentRepo repository.DeploymentRepository,
) *UseCase {
	return &UseCase{
		userRepo:      userRepo,
		incidentRepo:  incidentRepo,
		formRepo:      formRepo,
		orgRepo:       orgRepo,
		appRepo:       appRepo,
		orgReportRepo: orgReportRepo,
		anonRepo:      anonRepo,
		deploymentRepo: deploymentRepo,
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

func growthMetric(current, previous int) entity.GrowthMetric {
	var pct float64
	if previous > 0 {
		pct = math.Round(float64(current-previous)/float64(previous)*100*10) / 10
	} else if current > 0 {
		pct = 100
	}
	return entity.GrowthMetric{Current: current, Previous: previous, Percentage: pct}
}

// GetPlatformStats is the super admin's dashboard on the deployments model:
// organizations and their growth, pending applications, deployments by
// status, and public reports this month against last month.
func (uc *UseCase) GetPlatformStats(ctx context.Context) (*entity.PlatformStats, error) {
	now := time.Now()
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	startOfLastMonth := startOfMonth.AddDate(0, -1, 0)

	_, orgTotal, err := uc.orgRepo.FindAll(ctx, entity.ListParams{Limit: 1})
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

	deployments, err := uc.deploymentRepo.CountByStatus(ctx, nil)
	if err != nil {
		return nil, err
	}

	// Counts since a month's start include everything after it, so last
	// month alone is "since last month" minus "since this month".
	newOrgsThisMonth, err := uc.orgRepo.CountCreatedSince(ctx, startOfMonth)
	if err != nil {
		return nil, err
	}
	newOrgsSinceLastMonth, err := uc.orgRepo.CountCreatedSince(ctx, startOfLastMonth)
	if err != nil {
		return nil, err
	}
	reportsThisMonth, err := uc.anonRepo.CountCreatedSince(ctx, startOfMonth)
	if err != nil {
		return nil, err
	}
	reportsSinceLastMonth, err := uc.anonRepo.CountCreatedSince(ctx, startOfLastMonth)
	if err != nil {
		return nil, err
	}

	stats := &entity.PlatformStats{
		TotalOrganizations:  orgTotal,
		PendingApplications: pending,
		Deployments:         deployments,
		Reports:             growthMetric(reportsThisMonth, reportsSinceLastMonth-reportsThisMonth),
	}
	stats.Growth.Organizations = growthMetric(newOrgsThisMonth, newOrgsSinceLastMonth-newOrgsThisMonth)
	return stats, nil
}

func (uc *UseCase) GetPlatformActivityTrend(ctx context.Context) ([]*entity.WeeklyTrendPoint, error) {
	return uc.incidentRepo.GetPlatformWeeklyTrend(ctx)
}

func (uc *UseCase) GetPlatformReportsByType(ctx context.Context) ([]*entity.TypeCount, error) {
	return uc.anonRepo.GetTypeDistribution(ctx)
}

func (uc *UseCase) GetOrganizationByID(ctx context.Context, id string) (*entity.Organization, error) {
	return uc.orgRepo.FindByID(ctx, id)
}
