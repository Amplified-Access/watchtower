import type { ReportCatalogRepository } from "../../domain/report-catalog-repository";
import type { ReportActorContext } from "../../domain/report-catalog-types";
import { ReportForbiddenError, ReportNotFoundError } from "../../domain/errors";

interface GetReportByIdQuery {
  reportId: string;
  actor: ReportActorContext;
}

export class GetReportById {
  constructor(private readonly repository: ReportCatalogRepository) {}

  async execute(query: GetReportByIdQuery) {
    const report = await this.repository.getReportById(query.reportId);
    if (!report) {
      throw new ReportNotFoundError("Report not found");
    }

    if (
      query.actor.role !== "super-admin" &&
      query.actor.organizationId !== report.organizationId
    ) {
      throw new ReportForbiddenError(
        "You can only access reports from your own organization",
      );
    }

    return report;
  }
}
