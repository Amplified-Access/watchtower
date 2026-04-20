import type {
  BasicUserRecord,
  InviteWatcherInput,
  OrganizationWatcher,
} from "./admin-user-management-types";

export interface AdminUserManagementRepository {
  getOrganizationWatchers(organizationId: string): Promise<OrganizationWatcher[]>;
  inviteWatcher(input: InviteWatcherInput): Promise<void>;
  findUserById(userId: string): Promise<BasicUserRecord | null>;
  sendPasswordReset(email: string): Promise<void>;
}
