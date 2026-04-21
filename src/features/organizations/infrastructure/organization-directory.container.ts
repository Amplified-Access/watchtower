import { GetOrganizationBySlug } from "../application/use-cases/get-organization-by-slug";
import { GetPublicOrganizations } from "../application/use-cases/get-public-organizations";
import type { OrganizationDirectoryRepository } from "../domain/organization-directory-repository";
import { DrizzleOrganizationDirectoryRepository } from "./repositories/drizzle-organization-directory-repository";

export interface OrganizationDirectoryUseCases {
  getPublicOrganizations: GetPublicOrganizations;
  getOrganizationBySlug: GetOrganizationBySlug;
}

export const createOrganizationDirectoryUseCases = (
  repository: OrganizationDirectoryRepository = new DrizzleOrganizationDirectoryRepository(),
): OrganizationDirectoryUseCases => {
  return {
    getPublicOrganizations: new GetPublicOrganizations(repository),
    getOrganizationBySlug: new GetOrganizationBySlug(repository),
  };
};
