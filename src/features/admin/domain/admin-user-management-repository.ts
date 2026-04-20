import type {
  AdminFormRecord,
  AdminFormWithIncidentCount,
  BasicUserRecord,
  DeleteFormInput,
  InviteWatcherInput,
  OrganizationWatcher,
  SaveFormDefinitionInput,
  UpdateFormInput,
} from "./admin-user-management-types";

export interface AdminUserManagementRepository {
  getOrganizationWatchers(
    organizationId: string,
  ): Promise<OrganizationWatcher[]>;
  inviteWatcher(input: InviteWatcherInput): Promise<void>;
  findUserById(userId: string): Promise<BasicUserRecord | null>;
  sendPasswordReset(email: string): Promise<void>;
  saveFormDefinition(input: SaveFormDefinitionInput): Promise<void>;
  getOrganizationFormsWithIncidentCounts(
    organizationId: string,
  ): Promise<AdminFormWithIncidentCount[]>;
  findFormById(formId: string): Promise<AdminFormRecord | null>;
  updateForm(input: UpdateFormInput): Promise<void>;
  deleteForm(input: DeleteFormInput): Promise<void>;
}
