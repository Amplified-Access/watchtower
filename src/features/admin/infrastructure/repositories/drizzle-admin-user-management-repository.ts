import { db as defaultDb } from "@/db";
import { user } from "@/db/schemas/auth";
import { forms } from "@/db/schemas/forms";
import { incidents } from "@/db/schemas/incidents";
import { organizations } from "@/db/schemas/organizations";
import { auth } from "@/lib/auth";
import { generateRandomSecurePassword } from "@/utils/generate-random-password";
import { and, count, eq } from "drizzle-orm";
import { headers } from "next/headers";
import type { AdminUserManagementRepository } from "../../domain/admin-user-management-repository";
import type {
  AdminFormRecord,
  AdminFormWithIncidentCount,
  BasicUserRecord,
  DeleteFormInput,
  InviteWatcherInput,
  OrganizationWatcher,
  SaveFormDefinitionInput,
  UpdateFormInput,
} from "../../domain/admin-user-management-types";

export class DrizzleAdminUserManagementRepository implements AdminUserManagementRepository {
  constructor(private readonly database = defaultDb) {}

  async getOrganizationWatchers(
    organizationId: string,
  ): Promise<OrganizationWatcher[]> {
    const data = await this.database
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        organization: organizations.name,
      })
      .from(user)
      .leftJoin(organizations, eq(user.organizationId, organizations.id))
      .where(
        and(eq(user.role, "watcher"), eq(user.organizationId, organizationId)),
      );

    return data;
  }

  async inviteWatcher(input: InviteWatcherInput): Promise<void> {
    const response = await auth.api
      .signUpEmail({
        body: {
          name: input.name,
          email: input.email,
          password: generateRandomSecurePassword(),
        },
        asResponse: true,
      })
      .then((res) => res.json());

    if (response?.user?.id) {
      await auth.api.setRole({
        body: {
          userId: response.user.id,
          role: "watcher",
        },
        headers: await headers(),
      });

      await this.database
        .update(user)
        .set({ organizationId: input.organizationId })
        .where(eq(user.id, response.user.id));
    }

    await auth.api.requestPasswordReset({
      body: {
        email: input.email,
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password`,
      },
    });
  }

  async findUserById(userId: string): Promise<BasicUserRecord | null> {
    const [targetUser] = await this.database
      .select({
        id: user.id,
        organizationId: user.organizationId,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return targetUser ?? null;
  }

  async sendPasswordReset(email: string): Promise<void> {
    await auth.api.requestPasswordReset({
      body: {
        email,
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password`,
      },
    });
  }

  async saveFormDefinition(input: SaveFormDefinitionInput): Promise<void> {
    await this.database.insert(forms).values({
      organizationId: input.organizationId,
      name: input.title,
      definition: input.definition,
    });
  }

  async getOrganizationFormsWithIncidentCounts(
    organizationId: string,
  ): Promise<AdminFormWithIncidentCount[]> {
    const formsData = await this.database
      .select()
      .from(forms)
      .where(eq(forms.organizationId, organizationId));

    const formsWithIncidentCounts = await Promise.all(
      formsData.map(async (form) => {
        const incidentCountResult = await this.database
          .select({ count: count() })
          .from(incidents)
          .where(eq(incidents.formId, form.id));

        return {
          ...form,
          isActive: form.isActive ?? false,
          incidentCount: incidentCountResult[0]?.count || 0,
        };
      }),
    );

    return formsWithIncidentCounts as AdminFormWithIncidentCount[];
  }

  async findFormById(formId: string): Promise<AdminFormRecord | null> {
    const [existingForm] = await this.database
      .select()
      .from(forms)
      .where(eq(forms.id, formId))
      .limit(1);

    if (!existingForm) {
      return null;
    }

    return {
      ...(existingForm as AdminFormRecord),
      isActive: existingForm.isActive ?? false,
    };
  }

  async updateForm(input: UpdateFormInput): Promise<void> {
    const existingForm = await this.findFormById(input.formId);

    await this.database
      .update(forms)
      .set({
        name: input.title,
        definition: input.definition,
        isActive:
          input.isActive !== undefined
            ? input.isActive
            : (existingForm?.isActive ?? true),
        updatedAt: new Date(),
      })
      .where(eq(forms.id, input.formId));
  }

  async deleteForm(input: DeleteFormInput): Promise<void> {
    await this.database.delete(forms).where(eq(forms.id, input.formId));
  }
}
