import { ApproveOrganizationApplication } from "../application/use-cases/approve-organization-application";
import { DeclineOrganizationApplication } from "../application/use-cases/decline-organization-application";
import { GetAllOrganizationApplications } from "../application/use-cases/get-all-organization-applications";
import { GetAllOrganizations } from "../application/use-cases/get-all-organizations";
import { SubmitOrganizationApplication } from "../application/use-cases/submit-organization-application";
import type { IdentityProvisioner } from "../domain/identity-provisioner";
import type { OrganizationRegistrationRepository } from "../domain/organization-registration-repository";
import { DrizzleOrganizationRegistrationRepository } from "./repositories/drizzle-organization-registration-repository";
import { BetterAuthIdentityProvisioner } from "./services/better-auth-identity-provisioner";

export interface OrganizationRegistrationUseCases {
  getAllOrganizationApplications: GetAllOrganizationApplications;
  submitOrganizationApplication: SubmitOrganizationApplication;
  declineOrganizationApplication: DeclineOrganizationApplication;
  approveOrganizationApplication: ApproveOrganizationApplication;
  getAllOrganizations: GetAllOrganizations;
}

export const createOrganizationRegistrationUseCases = (
  repository: OrganizationRegistrationRepository = new DrizzleOrganizationRegistrationRepository(),
  identityProvisioner: IdentityProvisioner = new BetterAuthIdentityProvisioner(),
): OrganizationRegistrationUseCases => {
  return {
    getAllOrganizationApplications: new GetAllOrganizationApplications(
      repository,
    ),
    submitOrganizationApplication: new SubmitOrganizationApplication(repository),
    declineOrganizationApplication: new DeclineOrganizationApplication(
      repository,
    ),
    approveOrganizationApplication: new ApproveOrganizationApplication(
      repository,
      identityProvisioner,
    ),
    getAllOrganizations: new GetAllOrganizations(repository),
  };
};
