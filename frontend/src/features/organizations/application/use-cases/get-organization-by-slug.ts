import type { OrganizationDirectoryRepository } from "../../domain/organization-directory-repository";
import type { PublicOrganizationDetails } from "../../domain/organization-directory-types";
import {
  OrganizationDirectoryValidationError,
  OrganizationNotFoundError,
} from "../../domain/errors";

export class GetOrganizationBySlug {
  constructor(private readonly repository: OrganizationDirectoryRepository) {}

  async execute(slug: string): Promise<PublicOrganizationDetails> {
    if (!slug.trim()) {
      throw new OrganizationDirectoryValidationError(
        "Organization slug is required",
      );
    }

    const organization = await this.repository.getOrganizationBySlug(slug);
    if (!organization) {
      throw new OrganizationNotFoundError("Organization not found");
    }

    return organization;
  }
}
