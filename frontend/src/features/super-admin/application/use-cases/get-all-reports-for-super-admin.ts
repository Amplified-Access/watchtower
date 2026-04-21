import type { SuperAdminFormRepository } from "../../domain/super-admin-form-repository";
import type { GetAllReportsForSuperAdminInput } from "../../domain/super-admin-form-types";

export class GetAllReportsForSuperAdmin {
  constructor(private readonly repository: SuperAdminFormRepository) {}

  async execute(input: GetAllReportsForSuperAdminInput) {
    return this.repository.getAllReports(input);
  }
}
