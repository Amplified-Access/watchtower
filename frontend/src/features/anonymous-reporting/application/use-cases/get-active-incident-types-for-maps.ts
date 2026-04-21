import type { AnonymousReportingRepository } from "../../domain/anonymous-reporting-repository";

export class GetActiveIncidentTypesForMaps {
  constructor(private readonly repository: AnonymousReportingRepository) {}

  async execute() {
    const data = await this.repository.getActiveIncidentTypesForMaps();
    return {
      success: true,
      message: "Successfully retrieved incident types with reports",
      data,
    };
  }
}
