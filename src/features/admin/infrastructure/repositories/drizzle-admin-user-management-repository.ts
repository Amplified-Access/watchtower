import { db as defaultDb } from "@/db";
import { user } from "@/db/schemas/auth";
import { forms } from "@/db/schemas/forms";
import { incidents } from "@/db/schemas/incidents";
import { organizations } from "@/db/schemas/organizations";
import { auth } from "@/lib/auth";
import { generateRandomSecurePassword } from "@/utils/generate-random-password";
import { and, asc, count, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import type { AdminUserManagementRepository } from "../../domain/admin-user-management-repository";
import type {
  AdminFormRecord,
  AdminFormWithIncidentCount,
  AdminIncidentRecord,
  BasicUserRecord,
  DeleteFormInput,
  GetIncidentByIdInput,
  GetOrganizationIncidentsInput,
  InviteWatcherInput,
  OrganizationWatcher,
  SaveFormDefinitionInput,
  UpdateFormInput,
  UpdateIncidentStatusInput,
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

  async getOrganizationIncidents(input: GetOrganizationIncidentsInput) {
    const whereConditions = [
      eq(incidents.organizationId, input.organizationId),
    ];

    if (input.status) {
      whereConditions.push(eq(incidents.status, input.status));
    }

    if (input.formId) {
      whereConditions.push(eq(incidents.formId, input.formId));
    }

    let orderByClause;
    if (input.sortBy === "createdAt") {
      orderByClause =
        input.sortOrder === "desc"
          ? desc(incidents.createdAt)
          : asc(incidents.createdAt);
    } else if (input.sortBy === "updatedAt") {
      orderByClause =
        input.sortOrder === "desc"
          ? desc(incidents.updatedAt)
          : asc(incidents.updatedAt);
    } else {
      orderByClause =
        input.sortOrder === "desc"
          ? desc(incidents.status)
          : asc(incidents.status);
    }

    const data = await this.database
      .select({
        id: incidents.id,
        organizationId: incidents.organizationId,
        formId: incidents.formId,
        reportedByUserId: incidents.reportedByUserId,
        data: incidents.data,
        status: incidents.status,
        createdAt: incidents.createdAt,
        updatedAt: incidents.updatedAt,
        formName: forms.name,
        reporterEmail: user.email,
      })
      .from(incidents)
      .leftJoin(forms, eq(incidents.formId, forms.id))
      .leftJoin(user, eq(incidents.reportedByUserId, user.id))
      .where(and(...whereConditions))
      .orderBy(orderByClause)
      .limit(input.limit)
      .offset(input.offset);

    let filteredData = data;
    if (input.search) {
      const searchLower = input.search.toLowerCase();
      filteredData = data.filter((incident) => {
        const dataString = JSON.stringify(incident.data).toLowerCase();
        const formName = (incident.formName || "").toLowerCase();
        const reporterEmail = (incident.reporterEmail || "").toLowerCase();

        return (
          dataString.includes(searchLower) ||
          formName.includes(searchLower) ||
          reporterEmail.includes(searchLower) ||
          incident.status.toLowerCase().includes(searchLower)
        );
      });
    }

    const totalCountResult = await this.database
      .select({ count: count() })
      .from(incidents)
      .where(and(...whereConditions));

    const totalCount = totalCountResult[0]?.count || 0;

    return {
      incidents: filteredData as AdminIncidentRecord[],
      totalCount,
      hasMore: input.offset + filteredData.length < totalCount,
    };
  }

  async getIncidentById(
    input: GetIncidentByIdInput,
  ): Promise<AdminIncidentRecord | null> {
    const [incident] = await this.database
      .select({
        id: incidents.id,
        organizationId: incidents.organizationId,
        formId: incidents.formId,
        reportedByUserId: incidents.reportedByUserId,
        data: incidents.data,
        status: incidents.status,
        createdAt: incidents.createdAt,
        updatedAt: incidents.updatedAt,
        formName: forms.name,
        reporterEmail: user.email,
      })
      .from(incidents)
      .leftJoin(forms, eq(incidents.formId, forms.id))
      .leftJoin(user, eq(incidents.reportedByUserId, user.id))
      .where(eq(incidents.id, input.incidentId))
      .limit(1);

    return (incident as AdminIncidentRecord) ?? null;
  }

  async updateIncidentStatus(input: UpdateIncidentStatusInput): Promise<void> {
    await this.database
      .update(incidents)
      .set({
        status: input.status,
        updatedAt: new Date(),
      })
      .where(eq(incidents.id, input.incidentId));
  }
}
