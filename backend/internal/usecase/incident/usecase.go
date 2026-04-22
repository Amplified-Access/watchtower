package incidentusecase

import (
	"context"

	"backend/internal/domain/entity"
	domainerrors "backend/internal/domain/errors"
	"backend/internal/domain/repository"
)

type UseCase struct {
	incidentRepo    repository.IncidentRepository
	typeRepo        repository.IncidentTypeRepository
	anonRepo        repository.AnonymousIncidentReportRepository
	orgReportRepo   repository.OrganizationIncidentReportRepository
}

func New(
	incidentRepo repository.IncidentRepository,
	typeRepo repository.IncidentTypeRepository,
	anonRepo repository.AnonymousIncidentReportRepository,
	orgReportRepo repository.OrganizationIncidentReportRepository,
) *UseCase {
	return &UseCase{
		incidentRepo:  incidentRepo,
		typeRepo:      typeRepo,
		anonRepo:      anonRepo,
		orgReportRepo: orgReportRepo,
	}
}

func (uc *UseCase) GetAllTypes(ctx context.Context, activeOnly bool) ([]*entity.IncidentType, error) {
	return uc.typeRepo.FindAll(ctx, activeOnly)
}

func (uc *UseCase) GetTypesByOrganization(ctx context.Context, orgID string) ([]*entity.IncidentType, error) {
	return uc.typeRepo.FindByOrganizationID(ctx, orgID)
}

func (uc *UseCase) GetAvailableTypesForOrganization(ctx context.Context, orgID string) ([]*entity.IncidentType, error) {
	return uc.typeRepo.FindAvailableForOrganization(ctx, orgID)
}

func (uc *UseCase) CreateIncidentType(ctx context.Context, t *entity.IncidentType) error {
	return uc.typeRepo.Create(ctx, t)
}

func (uc *UseCase) EnableTypeForOrganization(ctx context.Context, orgID, typeID string) error {
	return uc.typeRepo.EnableForOrganization(ctx, orgID, typeID)
}

func (uc *UseCase) DisableTypeForOrganization(ctx context.Context, orgID, typeID string) error {
	return uc.typeRepo.DisableForOrganization(ctx, orgID, typeID)
}

func (uc *UseCase) SubmitIncident(ctx context.Context, incident *entity.Incident) error {
	return uc.incidentRepo.Create(ctx, incident)
}

func (uc *UseCase) GetOrganizationIncidents(ctx context.Context, orgID string, params entity.ListParams) ([]*entity.Incident, int, error) {
	return uc.incidentRepo.FindAll(ctx, orgID, params)
}

func (uc *UseCase) GetIncidentByID(ctx context.Context, id string) (*entity.Incident, error) {
	i, err := uc.incidentRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if i == nil {
		return nil, domainerrors.NewNotFound("incident not found")
	}
	return i, nil
}

func (uc *UseCase) UpdateIncidentStatus(ctx context.Context, id string, status entity.IncidentStatus) error {
	return uc.incidentRepo.UpdateStatus(ctx, id, status)
}

func (uc *UseCase) DeleteIncident(ctx context.Context, id string) error {
	return uc.incidentRepo.Delete(ctx, id)
}

func (uc *UseCase) GetAllIncidents(ctx context.Context, params entity.ListParams) ([]*entity.Incident, int, error) {
	return uc.incidentRepo.FindAllForSuperAdmin(ctx, params)
}

func (uc *UseCase) GetOrganizationStats(ctx context.Context, orgID string) (*entity.IncidentStats, error) {
	return uc.incidentRepo.GetStats(ctx, orgID)
}

func (uc *UseCase) GetWeeklyTrend(ctx context.Context, orgID string) ([]*entity.WeeklyTrendPoint, error) {
	return uc.incidentRepo.GetWeeklyTrend(ctx, orgID)
}

func (uc *UseCase) GetRecentIncidents(ctx context.Context, orgID string, limit int) ([]*entity.Incident, error) {
	return uc.incidentRepo.GetRecent(ctx, orgID, limit)
}

func (uc *UseCase) GetPendingIncidents(ctx context.Context, orgID string) ([]*entity.Incident, error) {
	return uc.incidentRepo.GetPending(ctx, orgID)
}

func (uc *UseCase) SubmitAnonymousReport(ctx context.Context, report *entity.AnonymousIncidentReport) error {
	return uc.anonRepo.Create(ctx, report)
}

func (uc *UseCase) GetAnonymousReports(ctx context.Context, country, category *string) ([]*entity.AnonymousIncidentReport, error) {
	return uc.anonRepo.FindAll(ctx, country, category)
}

func (uc *UseCase) GetHeatmapData(ctx context.Context) ([]*entity.HeatmapPoint, error) {
	return uc.anonRepo.GetHeatmapData(ctx)
}

func (uc *UseCase) SubmitOrgReport(ctx context.Context, report *entity.OrganizationIncidentReport) error {
	return uc.orgReportRepo.Create(ctx, report)
}

func (uc *UseCase) GetOrgReports(ctx context.Context, orgID string, params entity.ListParams) ([]*entity.OrganizationIncidentReport, int, error) {
	return uc.orgReportRepo.FindByOrganizationID(ctx, orgID, params)
}

func (uc *UseCase) GetUserOrgReports(ctx context.Context, userID, orgID string, params entity.ListParams) ([]*entity.OrganizationIncidentReport, int, error) {
	return uc.orgReportRepo.FindByUserID(ctx, userID, orgID, params)
}

func (uc *UseCase) GetOrgReportStats(ctx context.Context, orgID string) (*entity.IncidentStats, error) {
	return uc.orgReportRepo.GetStats(ctx, orgID)
}
