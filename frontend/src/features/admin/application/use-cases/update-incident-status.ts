import { AdminForbiddenError, AdminNotFoundError } from "../../domain/errors";
import type { AdminUserManagementRepository } from "../../domain/admin-user-management-repository";
import type { UpdateIncidentStatusInput } from "../../domain/admin-user-management-types";

export class UpdateIncidentStatus {
  constructor(private readonly repository: AdminUserManagementRepository) {}

  async execute(input: UpdateIncidentStatusInput) {
    const existingIncident = await this.repository.getIncidentById({
      incidentId: input.incidentId,
      actor: input.actor,
    });

    if (!existingIncident) {
      throw new AdminNotFoundError("Incident not found");
    }

    if (
      input.actor.role !== "super-admin" &&
      input.actor.organizationId !== existingIncident.organizationId
    ) {
      throw new AdminForbiddenError(
        "You can only update incidents from your own organization",
      );
    }

    await this.repository.updateIncidentStatus(input);

    return {
      success: true,
      message: "Incident status updated successfully",
    };
  }
}
