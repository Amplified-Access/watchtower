import type { OrganizationDirectoryRepository } from "../../domain/organization-directory-repository";
import type {
  GetPublicOrganizationsInput,
  PublicOrganizationsResult,
} from "../../domain/organization-directory-types";
import { OrganizationDirectoryValidationError } from "../../domain/errors";

export class GetPublicOrganizations {
  constructor(private readonly repository: OrganizationDirectoryRepository) {}

  async execute(
    input: GetPublicOrganizationsInput,
  ): Promise<PublicOrganizationsResult> {
    if (input.limit < 1 || input.limit > 50) {
      throw new OrganizationDirectoryValidationError(
        "Limit must be between 1 and 50",
      );
    }

    if (input.offset < 0) {
      throw new OrganizationDirectoryValidationError(
        "Offset must be 0 or greater",
      );
    }

    return this.repository.getPublicOrganizations(input);
  }
}
