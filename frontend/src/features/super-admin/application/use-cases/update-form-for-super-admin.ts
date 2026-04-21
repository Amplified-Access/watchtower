import { SuperAdminFormNotFoundError } from "../../domain/errors";
import type { SuperAdminFormRepository } from "../../domain/super-admin-form-repository";
import type { UpdateFormForSuperAdminInput } from "../../domain/super-admin-form-types";

export class UpdateFormForSuperAdmin {
  constructor(private readonly repository: SuperAdminFormRepository) {}

  async execute(input: UpdateFormForSuperAdminInput) {
    const existingForm = await this.repository.getFormById(input.formId);

    if (!existingForm) {
      throw new SuperAdminFormNotFoundError("Form not found");
    }

    await this.repository.updateForm(input);

    return {
      success: true,
      message: "Form updated successfully",
    };
  }
}
