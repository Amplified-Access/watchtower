import type { OrganizationRegistrationRepository } from "../../domain/organization-registration-repository";

export class GetAllOrganizations {
  constructor(
    private readonly repository: OrganizationRegistrationRepository,
  ) {}

  async execute() {
    return this.repository.listOrganizations();
  }
}
