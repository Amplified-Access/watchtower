import type { SuperAdminFormRepository } from "../../domain/super-admin-form-repository";
import type { GetCriticalIncidentsForSuperAdminInput } from "../../domain/super-admin-form-types";

export class GetCriticalIncidentsForSuperAdmin {
  constructor(private readonly repository: SuperAdminFormRepository) {}

  async execute(input: GetCriticalIncidentsForSuperAdminInput) {
    return this.repository.getCriticalIncidents(input);
  }
}
