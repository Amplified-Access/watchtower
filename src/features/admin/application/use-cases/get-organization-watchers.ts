import { AdminValidationError } from "../../domain/errors";
import type { AdminUserManagementRepository } from "../../domain/admin-user-management-repository";
import type { AdminActorContext } from "../../domain/admin-user-management-types";

export class GetOrganizationWatchers {
  constructor(private readonly repository: AdminUserManagementRepository) {}

  async execute(actor: AdminActorContext) {
    if (!actor.organizationId) {
      throw new AdminValidationError(
        "You must be associated with an organization to view watchers",
      );
    }

    return this.repository.getOrganizationWatchers(actor.organizationId);
  }
}
