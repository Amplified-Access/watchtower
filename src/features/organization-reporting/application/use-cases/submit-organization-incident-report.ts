import {
  IncidentTypeNotEnabledError,
  OrganizationMembershipRequiredError,
} from "../../domain/errors";
import type { IncidentSeverity } from "../../domain/organization-incident-report";
import type { OrganizationReportingRepository } from "../../domain/organization-reporting-repository";

type CasualtyCount = "0" | "1" | "2" | "3" | "4" | "5" | "6+";

export interface SubmitOrganizationIncidentReportInput {
  organizationId?: string;
  reportedByUserId: string;
  category: string;
  location: {
    lat: number;
    lon: number;
    admin1: string;
    region: string;
    country: string;
  };
  description: string;
  entities: string[];
  injuries: CasualtyCount;
  fatalities: CasualtyCount;
  severity: IncidentSeverity;
}

export class SubmitOrganizationIncidentReport {
  constructor(private readonly repository: OrganizationReportingRepository) {}

  async execute(input: SubmitOrganizationIncidentReportInput): Promise<{
    success: true;
    message: string;
  }> {
    if (!input.organizationId) {
      throw new OrganizationMembershipRequiredError();
    }

    const isEnabled = await this.repository.isIncidentTypeEnabledForOrganization(
      {
        organizationId: input.organizationId,
        incidentTypeId: input.category,
      },
    );

    if (!isEnabled) {
      throw new IncidentTypeNotEnabledError();
    }

    await this.repository.createIncidentReport({
      organizationId: input.organizationId,
      reportedByUserId: input.reportedByUserId,
      incidentTypeId: input.category,
      location: input.location,
      description: input.description,
      entities: input.entities,
      injuries: this.toCount(input.injuries),
      fatalities: this.toCount(input.fatalities),
      severity: input.severity,
    });

    return {
      success: true,
      message: "Incident report submitted successfully",
    };
  }

  private toCount(value: CasualtyCount): number {
    if (value === "6+") {
      return 6;
    }

    return Number.parseInt(value, 10);
  }
}
