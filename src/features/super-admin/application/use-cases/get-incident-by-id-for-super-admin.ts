import { SuperAdminFormNotFoundError } from "../../domain/errors";
import type { SuperAdminFormRepository } from "../../domain/super-admin-form-repository";

export class GetIncidentByIdForSuperAdmin {
  constructor(private readonly repository: SuperAdminFormRepository) {}

  async execute(incidentId: string) {
    const incident = await this.repository.getIncidentById(incidentId);

    if (!incident) {
      throw new SuperAdminFormNotFoundError("Incident not found");
    }

    return incident;
  }
}
