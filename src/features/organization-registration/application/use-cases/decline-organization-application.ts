import { OrganizationApplicationNotFoundError } from "../../domain/errors";
import type { OrganizationRegistrationRepository } from "../../domain/organization-registration-repository";

export class DeclineOrganizationApplication {
  constructor(
    private readonly repository: OrganizationRegistrationRepository,
  ) {}

  async execute(id: number) {
    const application = await this.repository.setApplicationStatus({
      id,
      status: "declined",
    });

    if (!application) {
      throw new OrganizationApplicationNotFoundError();
    }

    return {
      success: true,
      message: "FDeclined organization application.",
    };
  }
}
