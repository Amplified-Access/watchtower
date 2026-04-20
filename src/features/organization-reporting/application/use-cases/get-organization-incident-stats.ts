import { OrganizationMembershipRequiredError } from "../../domain/errors";
import type { OrganizationReportingRepository } from "../../domain/organization-reporting-repository";

export class GetOrganizationIncidentStats {
  constructor(private readonly repository: OrganizationReportingRepository) {}

  async execute(input: {
    organizationId?: string;
  }): Promise<{
    success: true;
    data: NonNullable<
      Awaited<
        ReturnType<OrganizationReportingRepository["getOrganizationIncidentStats"]>
      >
    >;
  }> {
    if (!input.organizationId) {
      throw new OrganizationMembershipRequiredError();
    }

    const data = await this.repository.getOrganizationIncidentStats(
      input.organizationId,
    );

    return {
      success: true,
      data: data ?? {
        totalReports: 0,
        totalFatalities: 0,
        totalInjuries: 0,
        verifiedReports: 0,
        unverifiedReports: 0,
        criticalReports: 0,
        highSeverityReports: 0,
      },
    };
  }
}
