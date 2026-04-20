import { GetOrganizationWatchers } from "../application/use-cases/get-organization-watchers";
import { InviteWatcher } from "../application/use-cases/invite-watcher";
import { ResetUserPassword } from "../application/use-cases/reset-user-password";
import { SaveFormDefinition } from "../application/use-cases/save-form-definition";
import { GetOrganizationFormsByOrganizationId } from "../application/use-cases/get-organization-forms-by-organization-id";
import { UpdateForm } from "../application/use-cases/update-form";
import { DeleteForm } from "../application/use-cases/delete-form";
import { GetAllOrganizationIncidents } from "../application/use-cases/get-all-organization-incidents";
import { GetIncidentById } from "../application/use-cases/get-incident-by-id";
import { UpdateIncidentStatus } from "../application/use-cases/update-incident-status";
import { GetOrganizationIncidentTypes } from "../application/use-cases/get-organization-incident-types";
import { GetAvailableIncidentTypes } from "../application/use-cases/get-available-incident-types";
import { EnableIncidentTypeForOrganization } from "../application/use-cases/enable-incident-type-for-organization";
import { CreateIncidentTypeForOrganization } from "../application/use-cases/create-incident-type-for-organization";
import { DisableIncidentTypeForOrganization } from "../application/use-cases/disable-incident-type-for-organization";
import { GetOrganizationPendingReports } from "../application/use-cases/get-organization-pending-reports";
import { GetOrganizationRecentIncidents } from "../application/use-cases/get-organization-recent-incidents";
import type { AdminUserManagementRepository } from "../domain/admin-user-management-repository";
import { DrizzleAdminUserManagementRepository } from "./repositories/drizzle-admin-user-management-repository";

export interface AdminUserManagementUseCases {
  getOrganizationWatchers: GetOrganizationWatchers;
  inviteWatcher: InviteWatcher;
  resetUserPassword: ResetUserPassword;
  saveFormDefinition: SaveFormDefinition;
  getOrganizationFormsByOrganizationId: GetOrganizationFormsByOrganizationId;
  updateForm: UpdateForm;
  deleteForm: DeleteForm;
  getAllOrganizationIncidents: GetAllOrganizationIncidents;
  getIncidentById: GetIncidentById;
  updateIncidentStatus: UpdateIncidentStatus;
  getOrganizationIncidentTypes: GetOrganizationIncidentTypes;
  getAvailableIncidentTypes: GetAvailableIncidentTypes;
  enableIncidentTypeForOrganization: EnableIncidentTypeForOrganization;
  createIncidentTypeForOrganization: CreateIncidentTypeForOrganization;
  disableIncidentTypeForOrganization: DisableIncidentTypeForOrganization;
  getOrganizationRecentIncidents: GetOrganizationRecentIncidents;
  getOrganizationPendingReports: GetOrganizationPendingReports;
}

export const createAdminUserManagementUseCases = (
  repository: AdminUserManagementRepository = new DrizzleAdminUserManagementRepository(),
): AdminUserManagementUseCases => {
  return {
    getOrganizationWatchers: new GetOrganizationWatchers(repository),
    inviteWatcher: new InviteWatcher(repository),
    resetUserPassword: new ResetUserPassword(repository),
    saveFormDefinition: new SaveFormDefinition(repository),
    getOrganizationFormsByOrganizationId:
      new GetOrganizationFormsByOrganizationId(repository),
    updateForm: new UpdateForm(repository),
    deleteForm: new DeleteForm(repository),
    getAllOrganizationIncidents: new GetAllOrganizationIncidents(repository),
    getIncidentById: new GetIncidentById(repository),
    updateIncidentStatus: new UpdateIncidentStatus(repository),
    getOrganizationIncidentTypes: new GetOrganizationIncidentTypes(repository),
    getAvailableIncidentTypes: new GetAvailableIncidentTypes(repository),
    enableIncidentTypeForOrganization: new EnableIncidentTypeForOrganization(
      repository,
    ),
    createIncidentTypeForOrganization: new CreateIncidentTypeForOrganization(
      repository,
    ),
    disableIncidentTypeForOrganization: new DisableIncidentTypeForOrganization(
      repository,
    ),
    getOrganizationRecentIncidents: new GetOrganizationRecentIncidents(
      repository,
    ),
    getOrganizationPendingReports: new GetOrganizationPendingReports(repository),
  };
};
