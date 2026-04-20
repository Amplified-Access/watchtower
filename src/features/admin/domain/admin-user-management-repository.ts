import type {
  AdminFormRecord,
  AdminFormWithIncidentCount,
  AdminIncidentRecord,
  BasicUserRecord,
  DeleteFormInput,
  GetOrganizationIncidentsInput,
  GetIncidentByIdInput,
  InviteWatcherInput,
  OrganizationWatcher,
  SaveFormDefinitionInput,
  UpdateFormInput,
  UpdateIncidentStatusInput,
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
  getOrganizationIncidents(input: GetOrganizationIncidentsInput): Promise<{
    incidents: AdminIncidentRecord[];
    totalCount: number;
    hasMore: boolean;
  }>;
  getIncidentById(
    input: GetIncidentByIdInput,
  ): Promise<AdminIncidentRecord | null>;
  updateIncidentStatus(input: UpdateIncidentStatusInput): Promise<void>;
}
