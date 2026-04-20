import { db as defaultDb } from "@/db";
import { user } from "@/db/schemas/auth";
import { forms } from "@/db/schemas/forms";
import { incidents } from "@/db/schemas/incidents";
import { organizations } from "@/db/schemas/organizations";
import { and, asc, count, desc, eq } from "drizzle-orm";
import type { SuperAdminFormRepository } from "../../domain/super-admin-form-repository";
import type {
  GetAllFormsForSuperAdminInput,
  SuperAdminFormRecord,
  SuperAdminFormWithIncidentCount,
  UpdateFormForSuperAdminInput,
} from "../../domain/super-admin-form-types";

export class DrizzleSuperAdminFormRepository implements SuperAdminFormRepository {
  constructor(private readonly database = defaultDb) {}

  async getAllForms(input: GetAllFormsForSuperAdminInput) {
    const whereConditions = [];

    if (input.organizationId) {
      whereConditions.push(eq(forms.organizationId, input.organizationId));
    }

    if (input.isActive !== undefined) {
      whereConditions.push(eq(forms.isActive, input.isActive));
    }

    let orderByClause;
    if (input.sortBy === "createdAt") {
      orderByClause =
        input.sortOrder === "desc" ? desc(forms.createdAt) : asc(forms.createdAt);
    } else if (input.sortBy === "updatedAt") {
      orderByClause =
        input.sortOrder === "desc" ? desc(forms.updatedAt) : asc(forms.updatedAt);
    } else {
      orderByClause = input.sortOrder === "desc" ? desc(forms.name) : asc(forms.name);
    }

    const data = await this.database
      .select({
        id: forms.id,
        organizationId: forms.organizationId,
        name: forms.name,
        definition: forms.definition,
        isActive: forms.isActive,
        createdAt: forms.createdAt,
        updatedAt: forms.updatedAt,
        organizationName: organizations.name,
      })
      .from(forms)
      .leftJoin(organizations, eq(forms.organizationId, organizations.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(orderByClause)
      .limit(input.limit)
      .offset(input.offset);

    const formsWithIncidentCounts = await Promise.all(
      data.map(async (form) => {
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

    let filteredData = formsWithIncidentCounts;
    if (input.search) {
      const searchLower = input.search.toLowerCase();
      filteredData = formsWithIncidentCounts.filter((form) => {
        const formName = (form.name || "").toLowerCase();
        const organizationName = (form.organizationName || "").toLowerCase();

        return (
          formName.includes(searchLower) || organizationName.includes(searchLower)
        );
      });
    }

    const totalCountResult = await this.database
      .select({ count: count() })
      .from(forms)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    const totalCount = totalCountResult[0]?.count || 0;

    return {
      forms: filteredData as SuperAdminFormWithIncidentCount[],
      totalCount,
      hasMore: input.offset + filteredData.length < totalCount,
    };
  }

  async getFormById(formId: string): Promise<SuperAdminFormRecord | null> {
    const [form] = await this.database
      .select({
        id: forms.id,
        organizationId: forms.organizationId,
        name: forms.name,
        definition: forms.definition,
        isActive: forms.isActive,
        createdAt: forms.createdAt,
        updatedAt: forms.updatedAt,
        organizationName: organizations.name,
      })
      .from(forms)
      .leftJoin(organizations, eq(forms.organizationId, organizations.id))
      .where(eq(forms.id, formId))
      .limit(1);

    if (!form) {
      return null;
    }

    return {
      ...form,
      isActive: form.isActive ?? false,
    } as SuperAdminFormRecord;
  }

  async updateForm(input: UpdateFormForSuperAdminInput): Promise<void> {
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.definition !== undefined) {
      updateData.definition = input.definition;
    }
    if (input.isActive !== undefined) {
      updateData.isActive = input.isActive;
    }

    await this.database.update(forms).set(updateData).where(eq(forms.id, input.formId));
  }

  async getFormIncidentCount(formId: string): Promise<number> {
    const incidentCountResult = await this.database
      .select({ count: count() })
      .from(incidents)
      .where(eq(incidents.formId, formId));

    return incidentCountResult[0]?.count || 0;
  }

  async deleteForm(formId: string): Promise<void> {
    await this.database.delete(forms).where(eq(forms.id, formId));
  }
}
