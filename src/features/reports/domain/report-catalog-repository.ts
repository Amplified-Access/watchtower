import type {
  CreateReportInput,
  GetOrganizationReportsInput,
  GetPublicReportsInput,
  OrganizationReportDetails,
  OrganizationReportsResult,
  PublicReportDetails,
  PublicReportListItem,
  UpdateReportInput,
} from "./report-catalog-types";

export interface ReportCatalogRepository {
  createReport(input: CreateReportInput): Promise<{ reportId: string }>;

  getOrganizationReports(
    input: GetOrganizationReportsInput,
  ): Promise<OrganizationReportsResult>;

  getReportById(reportId: string): Promise<OrganizationReportDetails | null>;

  updateReport(input: UpdateReportInput): Promise<void>;

  deleteReport(reportId: string): Promise<void>;

  getPublicReports(
    input: GetPublicReportsInput,
  ): Promise<PublicReportListItem[]>;

  getPublicReportById(reportId: string): Promise<PublicReportDetails | null>;
}
