import { DeleteFormForSuperAdmin } from "../application/use-cases/delete-form-for-super-admin";
import { DeleteIncidentForSuperAdmin } from "../application/use-cases/delete-incident-for-super-admin";
import { GetDashboardStatsForSuperAdmin } from "../application/use-cases/get-dashboard-stats-for-super-admin";
import { GetAllIncidentsForSuperAdmin } from "../application/use-cases/get-all-incidents-for-super-admin";
import { GetAllFormsForSuperAdmin } from "../application/use-cases/get-all-forms-for-super-admin";
import { GetAllReportsForSuperAdmin } from "../application/use-cases/get-all-reports-for-super-admin";
import { GetCriticalIncidentsForSuperAdmin } from "../application/use-cases/get-critical-incidents-for-super-admin";
import { GetOrganizationTypeDistributionForSuperAdmin } from "../application/use-cases/get-organization-type-distribution-for-super-admin";
import { GetPendingApplicationsForSuperAdmin } from "../application/use-cases/get-pending-applications-for-super-admin";
import { GetRecentActivityForSuperAdmin } from "../application/use-cases/get-recent-activity-for-super-admin";
import { GetFormByIdForSuperAdmin } from "../application/use-cases/get-form-by-id-for-super-admin";
import { GetIncidentByIdForSuperAdmin } from "../application/use-cases/get-incident-by-id-for-super-admin";
import { UpdateIncidentStatusForSuperAdmin } from "../application/use-cases/update-incident-status-for-super-admin";
import { UpdateFormForSuperAdmin } from "../application/use-cases/update-form-for-super-admin";
import type { SuperAdminFormRepository } from "../domain/super-admin-form-repository";
import { DrizzleSuperAdminFormRepository } from "./repositories/drizzle-super-admin-form-repository";

export interface SuperAdminFormUseCases {
  getAllFormsForSuperAdmin: GetAllFormsForSuperAdmin;
  getFormByIdForSuperAdmin: GetFormByIdForSuperAdmin;
  updateFormForSuperAdmin: UpdateFormForSuperAdmin;
  deleteFormForSuperAdmin: DeleteFormForSuperAdmin;
  getAllIncidentsForSuperAdmin: GetAllIncidentsForSuperAdmin;
  getIncidentByIdForSuperAdmin: GetIncidentByIdForSuperAdmin;
  updateIncidentStatusForSuperAdmin: UpdateIncidentStatusForSuperAdmin;
  deleteIncidentForSuperAdmin: DeleteIncidentForSuperAdmin;
  getAllReportsForSuperAdmin: GetAllReportsForSuperAdmin;
  getDashboardStatsForSuperAdmin: GetDashboardStatsForSuperAdmin;
  getRecentActivityForSuperAdmin: GetRecentActivityForSuperAdmin;
  getPendingApplicationsForSuperAdmin: GetPendingApplicationsForSuperAdmin;
  getCriticalIncidentsForSuperAdmin: GetCriticalIncidentsForSuperAdmin;
  getOrganizationTypeDistributionForSuperAdmin: GetOrganizationTypeDistributionForSuperAdmin;
}

export const createSuperAdminFormUseCases = (
  repository: SuperAdminFormRepository = new DrizzleSuperAdminFormRepository(),
): SuperAdminFormUseCases => {
  return {
    getAllFormsForSuperAdmin: new GetAllFormsForSuperAdmin(repository),
    getFormByIdForSuperAdmin: new GetFormByIdForSuperAdmin(repository),
    updateFormForSuperAdmin: new UpdateFormForSuperAdmin(repository),
    deleteFormForSuperAdmin: new DeleteFormForSuperAdmin(repository),
    getAllIncidentsForSuperAdmin: new GetAllIncidentsForSuperAdmin(repository),
    getIncidentByIdForSuperAdmin: new GetIncidentByIdForSuperAdmin(repository),
    updateIncidentStatusForSuperAdmin: new UpdateIncidentStatusForSuperAdmin(
      repository,
    ),
    deleteIncidentForSuperAdmin: new DeleteIncidentForSuperAdmin(repository),
    getAllReportsForSuperAdmin: new GetAllReportsForSuperAdmin(repository),
    getDashboardStatsForSuperAdmin: new GetDashboardStatsForSuperAdmin(
      repository,
    ),
    getRecentActivityForSuperAdmin: new GetRecentActivityForSuperAdmin(
      repository,
    ),
    getPendingApplicationsForSuperAdmin:
      new GetPendingApplicationsForSuperAdmin(repository),
    getCriticalIncidentsForSuperAdmin: new GetCriticalIncidentsForSuperAdmin(
      repository,
    ),
    getOrganizationTypeDistributionForSuperAdmin:
      new GetOrganizationTypeDistributionForSuperAdmin(repository),
  };
};
