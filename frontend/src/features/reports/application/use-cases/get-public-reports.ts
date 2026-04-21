import type { ReportCatalogRepository } from "../../domain/report-catalog-repository";
import type {
  GetPublicReportsInput,
  PublicReportListItem,
} from "../../domain/report-catalog-types";
import { ReportValidationError } from "../../domain/errors";

export class GetPublicReports {
  constructor(private readonly repository: ReportCatalogRepository) {}

  async execute(input: GetPublicReportsInput): Promise<PublicReportListItem[]> {
    if (input.limit < 1 || input.limit > 100) {
      throw new ReportValidationError("Limit must be between 1 and 100");
    }

    if (input.offset < 0) {
      throw new ReportValidationError("Offset must be 0 or greater");
    }

    return this.repository.getPublicReports(input);
  }
}
