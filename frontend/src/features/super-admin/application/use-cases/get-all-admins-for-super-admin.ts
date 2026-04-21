import type { SuperAdminFormRepository } from "../../domain/super-admin-form-repository";

export class GetAllAdminsForSuperAdmin {
  constructor(private readonly repository: SuperAdminFormRepository) {}

  async execute() {
    return this.repository.getAllAdmins();
  }
}
