import type {
  AvailableIncidentTypeRecord,
  AdminDashboardPendingReportItem,
  AdminDashboardRecentIncidentItem,
  AdminIncidentTypeAnalyticsItem,
  AdminWeeklyIncidentTrend,
  AdminFormRecord,
  AdminFormWithIncidentCount,
  AdminIncidentRecord,
  BasicUserRecord,
  CreateIncidentTypeInput,
  DeleteFormInput,
  GetOrganizationIncidentsInput,
  GetIncidentByIdInput,
  IncidentTypeActionInput,
  InviteWatcherInput,
  OrganizationIncidentTypeRecord,
  OrganizationWatcher,
  SaveFormDefinitionInput,
  UpdateFormInput,
  UpdateIncidentStatusInput,
} from "./admin-user-management-types";

export interface AdminUserManagementRepository {
  getOrganizationWatchers(
    organizationId: string,
  ): Promise<OrganizationWatcher[]>;
  inviteWatcher(input: InviteWatcherInput): Promise<void>;
  findUserById(userId: string): Promise<BasicUserRecord | null>;
  sendPasswordReset(email: string): Promise<void>;
  saveFormDefinition(input: SaveFormDefinitionInput): Promise<void>;
  getOrganizationFormsWithIncidentCounts(
    organizationId: string,
  ): Promise<AdminFormWithIncidentCount[]>;
  findFormById(formId: string): Promise<AdminFormRecord | null>;
  updateForm(input: UpdateFormInput): Promise<void>;
  deleteForm(input: DeleteFormInput): Promise<void>;
  getOrganizationIncidents(input: GetOrganizationIncidentsInput): Promise<{
    incidents: AdminIncidentRecord[];
    totalCount: number;
    hasMore: boolean;
  }>;
  getIncidentById(
    input: GetIncidentByIdInput,
  ): Promise<AdminIncidentRecord | null>;
  updateIncidentStatus(input: UpdateIncidentStatusInput): Promise<void>;
  getOrganizationIncidentTypes(
    organizationId: string,
  ): Promise<OrganizationIncidentTypeRecord[]>;
  getAvailableIncidentTypes(
    organizationId: string,
  ): Promise<AvailableIncidentTypeRecord[]>;
  findActiveIncidentTypeById(
    incidentTypeId: string,
  ): Promise<AvailableIncidentTypeRecord | null>;
  findIncidentTypeByNameInsensitive(
    name: string,
  ): Promise<AvailableIncidentTypeRecord | null>;
  isIncidentTypeEnabledForOrganization(
    input: IncidentTypeActionInput,
  ): Promise<boolean>;
  enableIncidentTypeForOrganization(
    input: IncidentTypeActionInput,
  ): Promise<void>;
  createIncidentType(
    input: CreateIncidentTypeInput,
  ): Promise<AvailableIncidentTypeRecord>;
  getOrganizationIncidentTypeLinkId(
    input: IncidentTypeActionInput,
  ): Promise<string | null>;
  disableIncidentTypeForOrganization(linkId: string): Promise<void>;
  getOrganizationRecentIncidents(input: {
    organizationId: string;
    limit: number;
  }): Promise<AdminDashboardRecentIncidentItem[]>;
  getOrganizationPendingReports(input: {
    organizationId: string;
    limit: number;
  }): Promise<AdminDashboardPendingReportItem[]>;
  getOrganizationIncidentTypesAnalytics(
    organizationId: string,
  ): Promise<AdminIncidentTypeAnalyticsItem[]>;
  getOrganizationWeeklyIncidentTrend(
    organizationId: string,
  ): Promise<AdminWeeklyIncidentTrend>;
}
