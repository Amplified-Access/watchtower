import { OrganizationMembershipRequiredError } from "../../domain/errors";
import type { OrganizationIncidentFilters } from "../../domain/organization-incident-report";
import type { OrganizationReportingRepository } from "../../domain/organization-reporting-repository";

export class GetOrganizationIncidentReports {
  constructor(private readonly repository: OrganizationReportingRepository) {}

  async execute(input: {
    organizationId?: string;
    filters: OrganizationIncidentFilters;
  }): Promise<{
    success: true;
    message: string;
    data: Awaited<
      ReturnType<OrganizationReportingRepository["getOrganizationIncidentReports"]>
    >;
  }> {
    if (!input.organizationId) {
      throw new OrganizationMembershipRequiredError();
    }

    const data = await this.repository.getOrganizationIncidentReports({
      organizationId: input.organizationId,
      filters: input.filters,
    });

    return {
      success: true,
      message: "Successfully fetched organization incident reports",
      data,
    };
  }
}
