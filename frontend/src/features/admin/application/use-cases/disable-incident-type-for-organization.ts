import type { AdminUserManagementRepository } from "../../domain/admin-user-management-repository";
import type { IncidentTypeActionInput } from "../../domain/admin-user-management-types";
import { AdminNotFoundError, AdminValidationError } from "../../domain/errors";

export class DisableIncidentTypeForOrganization {
  constructor(private readonly repository: AdminUserManagementRepository) {}

  async execute(input: IncidentTypeActionInput) {
    if (!input.actor.organizationId) {
      throw new AdminValidationError(
        "User must be associated with an organization",
      );
    }

    const linkId =
      await this.repository.getOrganizationIncidentTypeLinkId(input);

    if (!linkId) {
      throw new AdminNotFoundError(
        "Incident type not enabled for this organization",
      );
    }

    await this.repository.disableIncidentTypeForOrganization(linkId);

    return {
      success: true,
      message: "Incident type disabled for your organization",
    };
  }
}
