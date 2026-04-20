import type { OrganizationApplicationDraft } from "../../domain/organization-application";
import type { OrganizationRegistrationRepository } from "../../domain/organization-registration-repository";

export class SubmitOrganizationApplication {
  constructor(private readonly repository: OrganizationRegistrationRepository) {}

  async execute(input: OrganizationApplicationDraft) {
    await this.repository.submitApplication(input);

    return {
      success: true,
      message: "Organization application submitted successfully!",
      submittedData: input,
      error: undefined,
    };
  }
}
