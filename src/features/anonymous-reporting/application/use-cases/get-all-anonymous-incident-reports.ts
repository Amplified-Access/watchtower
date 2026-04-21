import type { AnonymousIncidentReportFilters } from "../../domain/anonymous-reporting.types";
import type { AnonymousReportingRepository } from "../../domain/anonymous-reporting-repository";

export class GetAllAnonymousIncidentReports {
  constructor(private readonly repository: AnonymousReportingRepository) {}

  async execute(filters: AnonymousIncidentReportFilters) {
    const data = await this.repository.getAllAnonymousIncidentReports(filters);

    return {
      success: true,
      message: "Successfully fetched anonymous incident reports",
      data,
    };
  }
}
