import { SuperAdminFormNotFoundError } from "../../domain/errors";
import type { SuperAdminFormRepository } from "../../domain/super-admin-form-repository";

export class DeleteIncidentForSuperAdmin {
  constructor(private readonly repository: SuperAdminFormRepository) {}

  async execute(incidentId: string) {
    const incident = await this.repository.getIncidentById(incidentId);

    if (!incident) {
      throw new SuperAdminFormNotFoundError("Incident not found");
    }

    await this.repository.deleteIncident(incidentId);

    return {
      success: true,
      message: "Incident deleted successfully",
    };
  }
}
