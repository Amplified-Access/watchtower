import type {
  OrganizationIncidentAggregate,
  OrganizationIncidentDraft,
  OrganizationIncidentFilters,
  OrganizationIncidentReport,
  OrganizationIncidentStats,
  UserOrganizationIncidentFilters,
} from "./organization-incident-report";

export interface OrganizationReportingRepository {
  isIncidentTypeEnabledForOrganization(params: {
    organizationId: string;
    incidentTypeId: string;
  }): Promise<boolean>;

  createIncidentReport(report: OrganizationIncidentDraft): Promise<void>;

  getOrganizationIncidentReports(params: {
    organizationId: string;
    filters: OrganizationIncidentFilters;
  }): Promise<OrganizationIncidentAggregate[]>;

  getUserOrganizationIncidentReports(params: {
    organizationId: string;
    userId: string;
    filters: UserOrganizationIncidentFilters;
  }): Promise<OrganizationIncidentReport[]>;

  getOrganizationIncidentStats(
    organizationId: string,
  ): Promise<OrganizationIncidentStats | null>;
}
