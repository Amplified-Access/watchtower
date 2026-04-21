import { SuperAdminFormNotFoundError } from "../../domain/errors";
import type { SuperAdminFormRepository } from "../../domain/super-admin-form-repository";
import type { UpdateIncidentStatusForSuperAdminInput } from "../../domain/super-admin-form-types";

export class UpdateIncidentStatusForSuperAdmin {
  constructor(private readonly repository: SuperAdminFormRepository) {}

  async execute(input: UpdateIncidentStatusForSuperAdminInput) {
    const incident = await this.repository.getIncidentById(input.incidentId);

    if (!incident) {
      throw new SuperAdminFormNotFoundError("Incident not found");
    }

    await this.repository.updateIncidentStatus(input);

    return {
      success: true,
      message: "Incident status updated successfully",
    };
  }
}
