import type { SuperAdminFormRepository } from "../../domain/super-admin-form-repository";
import type { GetPendingApplicationsForSuperAdminInput } from "../../domain/super-admin-form-types";

export class GetPendingApplicationsForSuperAdmin {
  constructor(private readonly repository: SuperAdminFormRepository) {}

  async execute(input: GetPendingApplicationsForSuperAdminInput) {
    return this.repository.getPendingApplications(input);
  }
}
