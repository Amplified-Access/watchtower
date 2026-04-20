import type { OrganizationRegistrationRepository } from "../../domain/organization-registration-repository";

export class GetAllOrganizationApplications {
  constructor(
    private readonly repository: OrganizationRegistrationRepository,
  ) {}

  async execute() {
    return this.repository.listApplications();
  }
}
