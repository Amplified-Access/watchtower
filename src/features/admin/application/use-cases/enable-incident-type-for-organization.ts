import type { AdminUserManagementRepository } from "../../domain/admin-user-management-repository";
import type { IncidentTypeActionInput } from "../../domain/admin-user-management-types";
import {
  AdminConflictError,
  AdminNotFoundError,
  AdminValidationError,
} from "../../domain/errors";

export class EnableIncidentTypeForOrganization {
  constructor(private readonly repository: AdminUserManagementRepository) {}

  async execute(input: IncidentTypeActionInput) {
    if (!input.actor.organizationId) {
      throw new AdminValidationError(
        "User must be associated with an organization",
      );
    }

    const incidentType = await this.repository.findActiveIncidentTypeById(
      input.incidentTypeId,
    );

    if (!incidentType) {
      throw new AdminNotFoundError("Incident type not found or inactive");
    }

    const alreadyEnabled =
      await this.repository.isIncidentTypeEnabledForOrganization(input);

    if (alreadyEnabled) {
      throw new AdminConflictError(
        "Incident type is already enabled for this organization",
      );
    }

    await this.repository.enableIncidentTypeForOrganization(input);

    return {
      success: true,
      message: "Incident type enabled successfully",
    };
  }
}
