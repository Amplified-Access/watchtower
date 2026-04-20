import { AdminForbiddenError } from "../../domain/errors";
import type { AdminUserManagementRepository } from "../../domain/admin-user-management-repository";
import type { AdminActorContext } from "../../domain/admin-user-management-types";

export class GetOrganizationFormsByOrganizationId {
  constructor(private readonly repository: AdminUserManagementRepository) {}

  async execute(input: { organizationId: string; actor: AdminActorContext }) {
    if (
      input.actor.role !== "super-admin" &&
      input.actor.organizationId !== input.organizationId
    ) {
      throw new AdminForbiddenError(
        "You can only access forms from your own organization",
      );
    }

    return this.repository.getOrganizationFormsWithIncidentCounts(
      input.organizationId,
    );
  }
}
