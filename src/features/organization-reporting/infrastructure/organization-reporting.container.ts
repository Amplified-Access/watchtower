import { GetOrganizationIncidentReports } from "../use-cases/get-organization-incident-reports";
import { GetOrganizationIncidentStats } from "../use-cases/get-organization-incident-stats";
import { GetUserOrganizationIncidentReports } from "../use-cases/get-user-organization-incident-reports";
import { SubmitOrganizationIncidentReport } from "../use-cases/submit-organization-incident-report";
import type { OrganizationReportingRepository } from "../domain/organization-reporting-repository";
import { DrizzleOrganizationReportingRepository } from "./repositories/drizzle-organization-reporting-repository";

export interface OrganizationReportingUseCases {
  submitOrganizationIncidentReport: SubmitOrganizationIncidentReport;
  getOrganizationIncidentReports: GetOrganizationIncidentReports;
  getUserOrganizationIncidentReports: GetUserOrganizationIncidentReports;
  getOrganizationIncidentStats: GetOrganizationIncidentStats;
}

export const createOrganizationReportingUseCases = (
  repository: OrganizationReportingRepository = new DrizzleOrganizationReportingRepository(),
): OrganizationReportingUseCases => {
  return {
    submitOrganizationIncidentReport: new SubmitOrganizationIncidentReport(
      repository,
    ),
    getOrganizationIncidentReports: new GetOrganizationIncidentReports(
      repository,
    ),
    getUserOrganizationIncidentReports: new GetUserOrganizationIncidentReports(
      repository,
    ),
    getOrganizationIncidentStats: new GetOrganizationIncidentStats(repository),
  };
};
