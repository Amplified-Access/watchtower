import type { AnonymousIncidentReportDraft } from "../../domain/anonymous-reporting.types";
import type { AnonymousReportingRepository } from "../../domain/anonymous-reporting-repository";

export class SubmitAnonymousIncidentReport {
  constructor(private readonly repository: AnonymousReportingRepository) {}

  async execute(input: AnonymousIncidentReportDraft) {
    await this.repository.createAnonymousIncidentReport(input);

    return {
      success: true,
      message: "Incident report submitted successfully",
    };
  }
}
