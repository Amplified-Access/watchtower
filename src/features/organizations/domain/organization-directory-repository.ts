import type {
  GetPublicOrganizationsInput,
  PublicOrganizationDetails,
  PublicOrganizationsResult,
} from "./organization-directory-types";

export interface OrganizationDirectoryRepository {
  getPublicOrganizations(
    input: GetPublicOrganizationsInput,
  ): Promise<PublicOrganizationsResult>;

  getOrganizationBySlug(slug: string): Promise<PublicOrganizationDetails | null>;
}
