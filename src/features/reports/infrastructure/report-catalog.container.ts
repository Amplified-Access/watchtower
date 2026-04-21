import { GetPublicReportById } from "../application/use-cases/get-public-report-by-id";
import { GetPublicReports } from "../application/use-cases/get-public-reports";
import type { ReportCatalogRepository } from "../domain/report-catalog-repository";
import { DrizzleReportCatalogRepository } from "./repositories/drizzle-report-catalog-repository";

export interface ReportCatalogUseCases {
  getPublicReports: GetPublicReports;
  getPublicReportById: GetPublicReportById;
}

export const createReportCatalogUseCases = (
  repository: ReportCatalogRepository = new DrizzleReportCatalogRepository(),
): ReportCatalogUseCases => {
  return {
    getPublicReports: new GetPublicReports(repository),
    getPublicReportById: new GetPublicReportById(repository),
  };
};
