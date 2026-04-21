import type { CombinedIncidentReportFilters } from "../../domain/anonymous-reporting.types";
import type { AnonymousReportingRepository } from "../../domain/anonymous-reporting-repository";

export class GetCombinedIncidentReports {
  constructor(private readonly repository: AnonymousReportingRepository) {}

  async execute(filters: CombinedIncidentReportFilters) {
    const data = await this.repository.getCombinedIncidentReports(filters);

    return {
      success: true,
      message: "Successfully fetched combined incident reports",
      data,
    };
  }
}
