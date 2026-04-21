import { AdminForbiddenError, AdminNotFoundError } from "../../domain/errors";
import type { AdminUserManagementRepository } from "../../domain/admin-user-management-repository";
import type { DeleteFormInput } from "../../domain/admin-user-management-types";

export class DeleteForm {
  constructor(private readonly repository: AdminUserManagementRepository) {}

  async execute(input: DeleteFormInput) {
    const existingForm = await this.repository.findFormById(input.formId);

    if (!existingForm) {
      throw new AdminNotFoundError("Form not found");
    }

    if (
      input.actor.role !== "super-admin" &&
      input.actor.organizationId !== existingForm.organizationId
    ) {
      throw new AdminForbiddenError(
        "You can only delete forms from your own organization",
      );
    }

    await this.repository.deleteForm(input);

    return {
      success: true,
      message: "Form deleted successfully",
    };
  }
}
