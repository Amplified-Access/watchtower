import { AdminForbiddenError, AdminNotFoundError } from "../../domain/errors";
import type { AdminUserManagementRepository } from "../../domain/admin-user-management-repository";
import type { UpdateFormInput } from "../../domain/admin-user-management-types";

export class UpdateForm {
  constructor(private readonly repository: AdminUserManagementRepository) {}

  async execute(input: UpdateFormInput) {
    const existingForm = await this.repository.findFormById(input.formId);

    if (!existingForm) {
      throw new AdminNotFoundError("Form not found");
    }

    if (
      input.actor.role !== "super-admin" &&
      input.actor.organizationId !== existingForm.organizationId
    ) {
      throw new AdminForbiddenError(
        "You can only update forms from your own organization",
      );
    }

    await this.repository.updateForm(input);

    return {
      success: true,
      message: "Form updated successfully",
    };
  }
}
