import type { AnonymousReportingRepository } from "../../domain/anonymous-reporting-repository";

export class GetAllIncidentTypes {
  constructor(private readonly repository: AnonymousReportingRepository) {}

  async execute() {
    const data = await this.repository.getAllIncidentTypes();
    return {
      success: true,
      message: "Successfully retrieved incident types",
      data,
    };
  }
}
