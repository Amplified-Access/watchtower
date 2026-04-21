import type { AdminUserManagementRepository } from "../../domain/admin-user-management-repository";
import type { CreateIncidentTypeInput } from "../../domain/admin-user-management-types";
import { AdminConflictError, AdminValidationError } from "../../domain/errors";

export class CreateIncidentTypeForOrganization {
  constructor(private readonly repository: AdminUserManagementRepository) {}

  async execute(input: CreateIncidentTypeInput) {
    if (!input.actor.organizationId) {
      throw new AdminValidationError(
        "User must be associated with an organization",
      );
    }

    const normalizedName = input.name.trim();
    const existingType =
      await this.repository.findIncidentTypeByNameInsensitive(normalizedName);

    if (existingType) {
      const alreadyEnabled =
        await this.repository.isIncidentTypeEnabledForOrganization({
          incidentTypeId: existingType.id,
          actor: input.actor,
        });

      if (alreadyEnabled) {
        throw new AdminConflictError(
          "Your organization has already enabled this incident type",
        );
      }

      await this.repository.enableIncidentTypeForOrganization({
        incidentTypeId: existingType.id,
        actor: input.actor,
      });

      return {
        success: true,
        message: "Existing incident type enabled for your organization",
        data: existingType,
        isExisting: true,
      };
    }

    const newIncidentType = await this.repository.createIncidentType({
      ...input,
      name: normalizedName,
    });

    await this.repository.enableIncidentTypeForOrganization({
      incidentTypeId: newIncidentType.id,
      actor: input.actor,
    });

    return {
      success: true,
      message: "New incident type created and enabled for your organization",
      data: newIncidentType,
      isExisting: false,
    };
  }
}
