import type {
  DashboardStats,
  OrganizationDetails,
  RecentActivityItem,
  SubmitIncidentInput,
  WatcherForm,
} from "./watcher-types";

export interface WatcherRepository {
  getUserOrganizationDetails(
    userId: string,
  ): Promise<OrganizationDetails | null>;
  getFormById(formId: string): Promise<WatcherForm | null>;
  getActiveFormsForOrganization(organizationId: string): Promise<WatcherForm[]>;
  submitIncident(input: SubmitIncidentInput): Promise<{ incidentId: string }>;
  getOrganizationDashboardStats(
    organizationId: string,
  ): Promise<DashboardStats>;
  getOrganizationRecentActivity(
    organizationId: string,
    limit: number,
  ): Promise<RecentActivityItem[]>;
}
