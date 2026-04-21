import { SuperAdminFormNotFoundError } from "../../domain/errors";
import type { SuperAdminFormRepository } from "../../domain/super-admin-form-repository";

export class GetFormByIdForSuperAdmin {
  constructor(private readonly repository: SuperAdminFormRepository) {}

  async execute(formId: string) {
    const form = await this.repository.getFormById(formId);

    if (!form) {
      throw new SuperAdminFormNotFoundError("Form not found");
    }

    return form;
  }
}
