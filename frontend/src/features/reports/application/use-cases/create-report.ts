import type { ReportCatalogRepository } from "../../domain/report-catalog-repository";
import type {
  ReportActorContext,
  ReportStatus,
} from "../../domain/report-catalog-types";
import { ReportValidationError } from "../../domain/errors";

interface CreateReportCommand {
  title: string;
  fileKey: string;
  status: ReportStatus;
  actor: ReportActorContext;
}

export class CreateReport {
  constructor(private readonly repository: ReportCatalogRepository) {}

  async execute(command: CreateReportCommand) {
    if (!command.actor.organizationId) {
      throw new ReportValidationError(
        "User must be associated with an organization",
      );
    }

    const { reportId } = await this.repository.createReport({
      title: command.title,
      fileKey: command.fileKey,
      status: command.status,
      organizationId: command.actor.organizationId,
      reportedById: command.actor.userId,
    });

    return {
      success: true,
      message: "Report created successfully",
      reportId,
    };
  }
}
