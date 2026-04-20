import { GetOrganizationWatchers } from "../application/use-cases/get-organization-watchers";
import { InviteWatcher } from "../application/use-cases/invite-watcher";
import { ResetUserPassword } from "../application/use-cases/reset-user-password";
import type { AdminUserManagementRepository } from "../domain/admin-user-management-repository";
import { DrizzleAdminUserManagementRepository } from "./repositories/drizzle-admin-user-management-repository";

export interface AdminUserManagementUseCases {
  getOrganizationWatchers: GetOrganizationWatchers;
  inviteWatcher: InviteWatcher;
  resetUserPassword: ResetUserPassword;
}

export const createAdminUserManagementUseCases = (
  repository: AdminUserManagementRepository = new DrizzleAdminUserManagementRepository(),
): AdminUserManagementUseCases => {
  return {
    getOrganizationWatchers: new GetOrganizationWatchers(repository),
    inviteWatcher: new InviteWatcher(repository),
    resetUserPassword: new ResetUserPassword(repository),
  };
};
