import type { ReportCatalogRepository } from "../../domain/report-catalog-repository";
import type { PublicReportDetails } from "../../domain/report-catalog-types";
import { ReportNotFoundError, ReportValidationError } from "../../domain/errors";

export class GetPublicReportById {
  constructor(private readonly repository: ReportCatalogRepository) {}

  async execute(reportId: string): Promise<PublicReportDetails> {
    if (!reportId.trim()) {
      throw new ReportValidationError("Report id is required");
    }

    const report = await this.repository.getPublicReportById(reportId);
    if (!report) {
      throw new ReportNotFoundError("Report not found");
    }

    return report;
  }
}
