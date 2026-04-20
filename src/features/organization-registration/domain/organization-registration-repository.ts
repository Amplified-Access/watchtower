import type {
  OrganizationApplication,
  OrganizationApplicationDraft,
  OrganizationEntity,
} from "./organization-application";

export interface OrganizationRegistrationRepository {
  listApplications(): Promise<OrganizationApplication[]>;
  submitApplication(
    input: OrganizationApplicationDraft,
  ): Promise<OrganizationApplication>;
  setApplicationStatus(params: {
    id: number;
    status: "approved" | "declined";
  }): Promise<OrganizationApplication | null>;
  createOrganization(params: {
    name: string;
    slug: string;
  }): Promise<OrganizationEntity>;
  assignUserToOrganization(params: {
    userId: string;
    organizationId: string;
  }): Promise<void>;
  listOrganizations(): Promise<OrganizationEntity[]>;
}
