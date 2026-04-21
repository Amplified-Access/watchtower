import { AdminForbiddenError, AdminNotFoundError } from "../../domain/errors";
import type { AdminUserManagementRepository } from "../../domain/admin-user-management-repository";
import type { GetIncidentByIdInput } from "../../domain/admin-user-management-types";

export class GetIncidentById {
  constructor(private readonly repository: AdminUserManagementRepository) {}

  async execute(input: GetIncidentByIdInput) {
    const incident = await this.repository.getIncidentById(input);

    if (!incident) {
      throw new AdminNotFoundError("Incident not found");
    }

    if (
      input.actor.role !== "super-admin" &&
      input.actor.organizationId !== incident.organizationId
    ) {
      throw new AdminForbiddenError(
        "You can only access incidents from your own organization",
      );
    }

    return incident;
  }
}
