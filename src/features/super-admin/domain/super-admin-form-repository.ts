import type {
  GetAllIncidentsForSuperAdminInput,
  GetAllFormsForSuperAdminInput,
  GetAllReportsForSuperAdminInput,
  GetPendingApplicationsForSuperAdminInput,
  GetRecentActivityForSuperAdminInput,
  SuperAdminDashboardStats,
  SuperAdminIncidentRecord,
  SuperAdminFormRecord,
  SuperAdminFormWithIncidentCount,
  SuperAdminRecentActivityItem,
  SuperAdminPendingApplicationItem,
  SuperAdminReportRecord,
  UpdateIncidentStatusForSuperAdminInput,
  UpdateFormForSuperAdminInput,
} from "./super-admin-form-types";

export interface SuperAdminFormRepository {
  getAllForms(input: GetAllFormsForSuperAdminInput): Promise<{
    forms: SuperAdminFormWithIncidentCount[];
    totalCount: number;
    hasMore: boolean;
  }>;
  getFormById(formId: string): Promise<SuperAdminFormRecord | null>;
  updateForm(input: UpdateFormForSuperAdminInput): Promise<void>;
  getFormIncidentCount(formId: string): Promise<number>;
  deleteForm(formId: string): Promise<void>;
  getAllIncidents(input: GetAllIncidentsForSuperAdminInput): Promise<{
    incidents: SuperAdminIncidentRecord[];
    totalCount: number;
    hasMore: boolean;
  }>;
  getIncidentById(incidentId: string): Promise<SuperAdminIncidentRecord | null>;
  updateIncidentStatus(
    input: UpdateIncidentStatusForSuperAdminInput,
  ): Promise<void>;
  deleteIncident(incidentId: string): Promise<void>;
  getAllReports(input: GetAllReportsForSuperAdminInput): Promise<{
    reports: SuperAdminReportRecord[];
    totalCount: number;
    hasMore: boolean;
  }>;
  getDashboardStats(): Promise<SuperAdminDashboardStats>;
  getRecentActivity(
    input: GetRecentActivityForSuperAdminInput,
  ): Promise<SuperAdminRecentActivityItem[]>;
  getPendingApplications(
    input: GetPendingApplicationsForSuperAdminInput,
  ): Promise<SuperAdminPendingApplicationItem[]>;
}
