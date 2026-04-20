import type { SuperAdminFormRepository } from "../../domain/super-admin-form-repository";
import type { GetRecentActivityForSuperAdminInput } from "../../domain/super-admin-form-types";

export class GetRecentActivityForSuperAdmin {
  constructor(private readonly repository: SuperAdminFormRepository) {}

  async execute(input: GetRecentActivityForSuperAdminInput) {
    return this.repository.getRecentActivity(input);
  }
}
