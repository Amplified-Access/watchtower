import { AdminForbiddenError } from "../../domain/errors";
import type { AdminUserManagementRepository } from "../../domain/admin-user-management-repository";
import type { GetOrganizationIncidentsInput } from "../../domain/admin-user-management-types";

export class GetAllOrganizationIncidents {
  constructor(private readonly repository: AdminUserManagementRepository) {}

  async execute(input: GetOrganizationIncidentsInput) {
    if (
      input.actor.role !== "super-admin" &&
      input.actor.organizationId !== input.organizationId
    ) {
      throw new AdminForbiddenError(
        "You can only access incidents from your own organization",
      );
    }

    return this.repository.getOrganizationIncidents(input);
  }
}
