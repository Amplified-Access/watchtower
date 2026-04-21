import type { AdminUserManagementRepository } from "../../domain/admin-user-management-repository";
import type { AdminActorContext } from "../../domain/admin-user-management-types";
import { AdminValidationError } from "../../domain/errors";

export class GetOrganizationIncidentTypesAnalytics {
  constructor(private readonly repository: AdminUserManagementRepository) {}

  async execute(actor: AdminActorContext) {
    if (!actor.organizationId) {
      throw new AdminValidationError(
        "User must be associated with an organization",
      );
    }

    return this.repository.getOrganizationIncidentTypesAnalytics(
      actor.organizationId,
    );
  }
}
