import type { SuperAdminFormRepository } from "../../domain/super-admin-form-repository";
import type { GetAllFormsForSuperAdminInput } from "../../domain/super-admin-form-types";

export class GetAllFormsForSuperAdmin {
  constructor(private readonly repository: SuperAdminFormRepository) {}

  async execute(input: GetAllFormsForSuperAdminInput) {
    return this.repository.getAllForms(input);
  }
}
