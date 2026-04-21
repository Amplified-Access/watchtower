import type {
  GetPublicReportsInput,
  PublicReportDetails,
  PublicReportListItem,
} from "./report-catalog-types";

export interface ReportCatalogRepository {
  getPublicReports(
    input: GetPublicReportsInput,
  ): Promise<PublicReportListItem[]>;

  getPublicReportById(reportId: string): Promise<PublicReportDetails | null>;
}
