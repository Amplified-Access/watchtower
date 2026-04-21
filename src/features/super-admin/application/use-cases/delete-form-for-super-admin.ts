import {
  SuperAdminFormNotFoundError,
  SuperAdminFormValidationError,
} from "../../domain/errors";
import type { SuperAdminFormRepository } from "../../domain/super-admin-form-repository";

export class DeleteFormForSuperAdmin {
  constructor(private readonly repository: SuperAdminFormRepository) {}

  async execute(formId: string) {
    const existingForm = await this.repository.getFormById(formId);

    if (!existingForm) {
      throw new SuperAdminFormNotFoundError("Form not found");
    }

    const incidentCount = await this.repository.getFormIncidentCount(formId);

    if (incidentCount > 0) {
      throw new SuperAdminFormValidationError(
        `Cannot delete form with ${incidentCount} associated incident(s). Delete incidents first.`,
      );
    }

    await this.repository.deleteForm(formId);

    return {
      success: true,
      message: "Form deleted successfully",
    };
  }
}
