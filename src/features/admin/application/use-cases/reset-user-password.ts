import {
  AdminForbiddenError,
  AdminNotFoundError,
} from "../../domain/errors";
import type { AdminUserManagementRepository } from "../../domain/admin-user-management-repository";
import type { ResetUserPasswordInput } from "../../domain/admin-user-management-types";

export class ResetUserPassword {
  constructor(private readonly repository: AdminUserManagementRepository) {}

  async execute(input: ResetUserPasswordInput) {
    const targetUser = await this.repository.findUserById(input.userId);

    if (!targetUser) {
      throw new AdminNotFoundError("User not found");
    }

    if (
      input.actor.role !== "super-admin" &&
      input.actor.organizationId !== targetUser.organizationId
    ) {
      throw new AdminForbiddenError(
        "You can only reset passwords for users in your organization",
      );
    }

    await this.repository.sendPasswordReset(input.email);

    return {
      success: true,
      message: "Password reset email sent successfully",
    };
  }
}
