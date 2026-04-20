import { db as defaultDb } from "@/db";
import { user } from "@/db/schemas/auth";
import { organizationApplications } from "@/db/schemas/organization-applications";
import { organizations } from "@/db/schemas/organizations";
import { eq } from "drizzle-orm";
import type {
  OrganizationApplication,
  OrganizationApplicationDraft,
  OrganizationEntity,
} from "../../domain/organization-application";
import type { OrganizationRegistrationRepository } from "../../domain/organization-registration-repository";

export class DrizzleOrganizationRegistrationRepository
  implements OrganizationRegistrationRepository
{
  constructor(private readonly database = defaultDb) {}

  async listApplications(): Promise<OrganizationApplication[]> {
    return this.database.select().from(organizationApplications);
  }

  async submitApplication(
    input: OrganizationApplicationDraft,
  ): Promise<OrganizationApplication> {
    const [created] = await this.database
      .insert(organizationApplications)
      .values({
        organizationName: input.organizationName,
        applicantName: input.applicantName,
        applicantEmail: input.applicantEmail,
        website: input.website,
        certificateOfIncorporation: input.certificateOfIncorporation,
      })
      .returning();

    return created;
  }

  async setApplicationStatus(params: {
    id: number;
    status: "approved" | "declined";
  }): Promise<OrganizationApplication | null> {
    const [updated] = await this.database
      .update(organizationApplications)
      .set({ status: params.status })
      .where(eq(organizationApplications.id, params.id))
      .returning();

    return updated ?? null;
  }

  async createOrganization(params: {
    name: string;
    slug: string;
  }): Promise<OrganizationEntity> {
    const [created] = await this.database
      .insert(organizations)
      .values({
        name: params.name,
        slug: params.slug,
      })
      .returning();

    return created;
  }

  async assignUserToOrganization(params: {
    userId: string;
    organizationId: string;
  }): Promise<void> {
    await this.database
      .update(user)
      .set({ organizationId: params.organizationId })
      .where(eq(user.id, params.userId));
  }

  async listOrganizations(): Promise<OrganizationEntity[]> {
    return this.database.select().from(organizations);
  }
}
