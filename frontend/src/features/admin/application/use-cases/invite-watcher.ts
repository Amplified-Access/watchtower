import type { AdminUserManagementRepository } from "../../domain/admin-user-management-repository";
import type { InviteWatcherInput } from "../../domain/admin-user-management-types";
import { AdminValidationError } from "../../domain/errors";

export class InviteWatcher {
  constructor(private readonly repository: AdminUserManagementRepository) {}

  async execute(input: InviteWatcherInput) {
    if (!input.organizationId) {
      throw new AdminValidationError(
        "Organization is required to invite a watcher",
      );
    }

    await this.repository.inviteWatcher({
      ...input,
      organizationId: input.organizationId,
    });

    return {
      success: true,
      message: "Watcher invited successfully",
    };
  }
}
