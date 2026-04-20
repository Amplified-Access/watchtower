import type { SuperAdminFormRepository } from "../../domain/super-admin-form-repository";
import type { GetAllIncidentsForSuperAdminInput } from "../../domain/super-admin-form-types";

export class GetAllIncidentsForSuperAdmin {
  constructor(private readonly repository: SuperAdminFormRepository) {}

  async execute(input: GetAllIncidentsForSuperAdminInput) {
    return this.repository.getAllIncidents(input);
  }
}
