import { generateRandomSecurePassword } from "@/utils/generate-random-password";
import type { IdentityProvisioner } from "../../domain/identity-provisioner";
import type { OrganizationRegistrationRepository } from "../../domain/organization-registration-repository";

export class ApproveOrganizationApplication {
  constructor(
    private readonly repository: OrganizationRegistrationRepository,
    private readonly identityProvisioner: IdentityProvisioner,
  ) {}

  async execute(id: number) {
    const application = await this.repository.setApplicationStatus({
      id,
      status: "approved",
    });

    if (!application) {
      return {
        success: false,
        message: "Application not found.",
      };
    }

    const slug = application.organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const organization = await this.repository.createOrganization({
      name: application.organizationName,
      slug,
    });

    const created = await this.identityProvisioner.createAdminAccount({
      name: application.applicantName,
      email: application.applicantEmail,
      password: generateRandomSecurePassword(),
    });

    if (created.userId) {
      await this.identityProvisioner.setUserRole({
        userId: created.userId,
        role: "admin",
      });

      await this.repository.assignUserToOrganization({
        userId: created.userId,
        organizationId: organization.id,
      });
    }

    await this.identityProvisioner.sendPasswordReset({
      email: application.applicantEmail,
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password`,
    });

    return {
      success: true,
      message: "Application approved and organization created.",
    };
  }
}
