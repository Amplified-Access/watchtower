import type { ReportCatalogRepository } from "../../domain/report-catalog-repository";
import type { ReportActorContext } from "../../domain/report-catalog-types";
import { ReportForbiddenError, ReportNotFoundError } from "../../domain/errors";

interface DeleteReportCommand {
  reportId: string;
  actor: ReportActorContext;
}

export class DeleteReport {
  constructor(private readonly repository: ReportCatalogRepository) {}

  async execute(command: DeleteReportCommand) {
    const existingReport = await this.repository.getReportById(command.reportId);
    if (!existingReport) {
      throw new ReportNotFoundError("Report not found");
    }

    if (
      command.actor.role !== "super-admin" &&
      command.actor.organizationId !== existingReport.organizationId
    ) {
      throw new ReportForbiddenError(
        "You can only delete reports from your own organization",
      );
    }

    await this.repository.deleteReport(command.reportId);

    return { success: true, message: "Report deleted successfully" };
  }
}
