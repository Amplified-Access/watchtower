import { OrganizationMembershipRequiredError } from "../../domain/errors";
import type { UserOrganizationIncidentFilters } from "../../domain/organization-incident-report";
import type { OrganizationReportingRepository } from "../../domain/organization-reporting-repository";

export class GetUserOrganizationIncidentReports {
  constructor(private readonly repository: OrganizationReportingRepository) {}

  async execute(input: {
    organizationId?: string;
    userId: string;
    filters: UserOrganizationIncidentFilters;
  }): Promise<{
    success: true;
    message: string;
    reports: Awaited<
      ReturnType<
        OrganizationReportingRepository["getUserOrganizationIncidentReports"]
      >
    >;
  }> {
    if (!input.organizationId) {
      throw new OrganizationMembershipRequiredError();
    }

    const reports = await this.repository.getUserOrganizationIncidentReports({
      organizationId: input.organizationId,
      userId: input.userId,
      filters: input.filters,
    });

    return {
      success: true,
      message: "Successfully fetched user's organization incident reports",
      reports,
    };
  }
}
