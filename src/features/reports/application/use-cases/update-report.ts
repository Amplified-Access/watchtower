import type { ReportCatalogRepository } from "../../domain/report-catalog-repository";
import type {
  ReportActorContext,
  ReportStatus,
} from "../../domain/report-catalog-types";
import { ReportForbiddenError, ReportNotFoundError } from "../../domain/errors";

interface UpdateReportCommand {
  reportId: string;
  title?: string;
  status?: ReportStatus;
  actor: ReportActorContext;
}

export class UpdateReport {
  constructor(private readonly repository: ReportCatalogRepository) {}

  async execute(command: UpdateReportCommand) {
    const existingReport = await this.repository.getReportById(command.reportId);
    if (!existingReport) {
      throw new ReportNotFoundError("Report not found");
    }

    if (
      command.actor.role !== "super-admin" &&
      command.actor.organizationId !== existingReport.organizationId
    ) {
      throw new ReportForbiddenError(
        "You can only update reports from your own organization",
      );
    }

    await this.repository.updateReport({
      reportId: command.reportId,
      title: command.title,
      status: command.status,
    });

    return { success: true, message: "Report updated successfully" };
  }
}
