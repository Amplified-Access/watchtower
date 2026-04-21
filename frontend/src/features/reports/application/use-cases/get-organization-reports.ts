import type { ReportCatalogRepository } from "../../domain/report-catalog-repository";
import type {
  ReportActorContext,
  ReportFilterStatus,
} from "../../domain/report-catalog-types";
import { ReportForbiddenError } from "../../domain/errors";

interface GetOrganizationReportsQuery {
  organizationId: string;
  status: ReportFilterStatus;
  limit: number;
  offset: number;
  actor: ReportActorContext;
}

export class GetOrganizationReports {
  constructor(private readonly repository: ReportCatalogRepository) {}

  async execute(query: GetOrganizationReportsQuery) {
    if (
      query.actor.role !== "super-admin" &&
      query.actor.organizationId !== query.organizationId
    ) {
      throw new ReportForbiddenError(
        "You can only access reports from your own organization",
      );
    }

    return this.repository.getOrganizationReports({
      organizationId: query.organizationId,
      status: query.status,
      limit: query.limit,
      offset: query.offset,
    });
  }
}
