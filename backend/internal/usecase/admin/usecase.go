package adminusecase

import (
	"context"
	"fmt"
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
}

func New(
	userRepo repository.UserRepository,
	incidentRepo repository.IncidentRepository,
	formRepo repository.FormRepository,
	orgRepo repository.OrganizationRepository,
	appRepo repository.OrganizationApplicationRepository,
	orgReportRepo repository.OrganizationIncidentReportRepository,
	anonRepo repository.AnonymousIncidentReportRepository,
) *UseCase {
	return &UseCase{
		userRepo:      userRepo,
		incidentRepo:  incidentRepo,
		formRepo:      formRepo,
		orgRepo:       orgRepo,
		appRepo:       appRepo,
		orgReportRepo: orgReportRepo,
		anonRepo:      anonRepo,
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

func (uc *UseCase) GetPlatformStats(ctx context.Context) (*entity.PlatformStats, error) {
	now := time.Now()
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	startOfLastMonth := startOfMonth.AddDate(0, -1, 0)

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

	// Growth metrics
	newOrgsThisMonth, err := uc.orgRepo.CountCreatedSince(ctx, startOfMonth)
	if err != nil {
		return nil, err
	}
	newOrgsLastMonth, err := uc.orgRepo.CountCreatedSince(ctx, startOfLastMonth)
	if err != nil {
		return nil, err
	}
	newOrgsLastMonthOnly := newOrgsLastMonth - newOrgsThisMonth

	newAdminsThisMonth, err := uc.userRepo.CountByRoleSince(ctx, entity.RoleAdmin, startOfMonth)
	if err != nil {
		return nil, err
	}
	newAdminsLastMonth, err := uc.userRepo.CountByRoleSince(ctx, entity.RoleAdmin, startOfLastMonth)
	if err != nil {
		return nil, err
	}
	newAdminsLastMonthOnly := newAdminsLastMonth - newAdminsThisMonth

	newWatchersThisMonth, err := uc.userRepo.CountByRoleSince(ctx, entity.RoleWatcher, startOfMonth)
	if err != nil {
		return nil, err
	}
	newWatchersLastMonth, err := uc.userRepo.CountByRoleSince(ctx, entity.RoleWatcher, startOfLastMonth)
	if err != nil {
		return nil, err
	}
	newWatchersLastMonthOnly := newWatchersLastMonth - newWatchersThisMonth

	reportsThisMonth, err := uc.incidentRepo.CountAllSince(ctx, startOfMonth)
	if err != nil {
		return nil, err
	}

	criticalIncidents, err := uc.orgReportRepo.CountCritical(ctx)
	if err != nil {
		return nil, err
	}

	totalAdmins := len(admins) + len(superAdmins)
	totalWatchers := len(watchers)

	var avgReportsPerOrg float64
	if orgTotal > 0 {
		avgReportsPerOrg = math.Round(float64(reportsThisMonth)/float64(orgTotal)*10) / 10
	}

	return &entity.PlatformStats{
		TotalOrganizations:  orgTotal,
		TotalAdmins:         totalAdmins,
		TotalWatchers:       totalWatchers,
		PendingApplications: pending,
		ReportsThisMonth:    reportsThisMonth,
		ActiveForms:         activeForms,
		CriticalIncidents:   criticalIncidents,
		UptimePercentage:    99.9,
		Growth: struct {
			Organizations entity.GrowthMetric `json:"organizations"`
			Admins        entity.GrowthMetric `json:"admins"`
			Watchers      entity.GrowthMetric `json:"watchers"`
		}{
			Organizations: growthMetric(newOrgsThisMonth, newOrgsLastMonthOnly),
			Admins:        growthMetric(newAdminsThisMonth, newAdminsLastMonthOnly),
			Watchers:      growthMetric(newWatchersThisMonth, newWatchersLastMonthOnly),
		},
		Metrics: struct {
			NewOrganizationsThisMonth int     `json:"newOrganizationsThisMonth"`
			NewAdminsThisMonth        int     `json:"newAdminsThisMonth"`
			NewWatchersThisMonth      int     `json:"newWatchersThisMonth"`
			AverageReportsPerOrg      float64 `json:"averageReportsPerOrg"`
		}{
			NewOrganizationsThisMonth: newOrgsThisMonth,
			NewAdminsThisMonth:        newAdminsThisMonth,
			NewWatchersThisMonth:      newWatchersThisMonth,
			AverageReportsPerOrg:      avgReportsPerOrg,
		},
	}, nil
}

func (uc *UseCase) GetRecentActivity(ctx context.Context, limit int) ([]*entity.ActivityItem, error) {
	if limit <= 0 {
		limit = 10
	}
	incidents, _, err := uc.incidentRepo.FindAllForSuperAdmin(ctx, entity.ListParams{Limit: limit})
	if err != nil {
		return nil, err
	}

	apps, err := uc.appRepo.FindAll(ctx)
	if err != nil {
		return nil, err
	}

	var items []*entity.ActivityItem

	for _, i := range incidents {
		items = append(items, &entity.ActivityItem{
			ID:          i.ID,
			Type:        "incident",
			Description: fmt.Sprintf("New incident submitted (status: %s)", i.Status),
			Timestamp:   i.CreatedAt,
		})
	}

	appLimit := limit - len(items)
	if appLimit > len(apps) {
		appLimit = len(apps)
	}
	for _, a := range apps[:appLimit] {
		desc := fmt.Sprintf("Organization application from %s (%s)", a.OrganizationName, a.Status)
		items = append(items, &entity.ActivityItem{
			ID:          fmt.Sprintf("app-%d", a.ID),
			Type:        "application",
			Description: desc,
			Timestamp:   a.CreatedAt,
		})
	}

	// Sort by timestamp descending
	for i := 0; i < len(items); i++ {
		for j := i + 1; j < len(items); j++ {
			if items[j].Timestamp.After(items[i].Timestamp) {
				items[i], items[j] = items[j], items[i]
			}
		}
	}
	if len(items) > limit {
		items = items[:limit]
	}

	return items, nil
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
