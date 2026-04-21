import type { AdminUserManagementRepository } from "../../domain/admin-user-management-repository";
import type { GetAdminDashboardListInput } from "../../domain/admin-user-management-types";
import { AdminValidationError } from "../../domain/errors";

export class GetOrganizationPendingReports {
  constructor(private readonly repository: AdminUserManagementRepository) {}

  async execute(input: GetAdminDashboardListInput) {
    if (!input.actor.organizationId) {
      throw new AdminValidationError(
        "User must be associated with an organization",
      );
    }

    return this.repository.getOrganizationPendingReports({
      organizationId: input.actor.organizationId,
      limit: input.limit,
    });
  }
}
