import { CreateReport } from "../application/use-cases/create-report";
import { DeleteReport } from "../application/use-cases/delete-report";
import { GetOrganizationReports } from "../application/use-cases/get-organization-reports";
import { GetPublicReportById } from "../application/use-cases/get-public-report-by-id";
import { GetPublicReports } from "../application/use-cases/get-public-reports";
import { GetReportById } from "../application/use-cases/get-report-by-id";
import { UpdateReport } from "../application/use-cases/update-report";
import type { ReportCatalogRepository } from "../domain/report-catalog-repository";
import { DrizzleReportCatalogRepository } from "./repositories/drizzle-report-catalog-repository";

export interface ReportCatalogUseCases {
  createReport: CreateReport;
  getOrganizationReports: GetOrganizationReports;
  getReportById: GetReportById;
  updateReport: UpdateReport;
  deleteReport: DeleteReport;
  getPublicReports: GetPublicReports;
  getPublicReportById: GetPublicReportById;
}

export const createReportCatalogUseCases = (
  repository: ReportCatalogRepository = new DrizzleReportCatalogRepository(),
): ReportCatalogUseCases => {
  return {
    createReport: new CreateReport(repository),
    getOrganizationReports: new GetOrganizationReports(repository),
    getReportById: new GetReportById(repository),
    updateReport: new UpdateReport(repository),
    deleteReport: new DeleteReport(repository),
    getPublicReports: new GetPublicReports(repository),
    getPublicReportById: new GetPublicReportById(repository),
  };
};
