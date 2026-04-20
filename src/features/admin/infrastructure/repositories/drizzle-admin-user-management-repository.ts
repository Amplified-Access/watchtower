import { db as defaultDb } from "@/db";
import { user } from "@/db/schemas/auth";
import { forms } from "@/db/schemas/forms";
import { incidentTypes } from "@/db/schemas/incident-types";
import { incidents } from "@/db/schemas/incidents";
import { organizationIncidentTypes } from "@/db/schemas/organization-incident-types";
import { organizations } from "@/db/schemas/organizations";
import { reports } from "@/db/schemas/reports";
import { auth } from "@/lib/auth";
import { generateRandomSecurePassword } from "@/utils/generate-random-password";
import { and, asc, count, desc, eq, gte, lt, sql } from "drizzle-orm";
import { headers } from "next/headers";
import type { AdminUserManagementRepository } from "../../domain/admin-user-management-repository";
import type {
  AvailableIncidentTypeRecord,
  AdminDashboardPendingReportItem,
  AdminDashboardRecentIncidentItem,
  AdminIncidentTypeAnalyticsItem,
  AdminWeeklyIncidentTrend,
  AdminFormRecord,
  AdminFormWithIncidentCount,
  AdminIncidentRecord,
  BasicUserRecord,
  CreateIncidentTypeInput,
  DeleteFormInput,
  GetIncidentByIdInput,
  GetOrganizationIncidentsInput,
  IncidentTypeActionInput,
  InviteWatcherInput,
  OrganizationIncidentTypeRecord,
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

  async getOrganizationIncidentTypes(
    organizationId: string,
  ): Promise<OrganizationIncidentTypeRecord[]> {
    const organizationTypes = await this.database
      .select({
        id: incidentTypes.id,
        name: incidentTypes.name,
        description: incidentTypes.description,
        color: incidentTypes.color,
        isActive: incidentTypes.isActive,
        createdAt: incidentTypes.createdAt,
        updatedAt: incidentTypes.updatedAt,
        isEnabled: organizationIncidentTypes.isEnabled,
        organizationEnabledAt: organizationIncidentTypes.createdAt,
      })
      .from(organizationIncidentTypes)
      .innerJoin(
        incidentTypes,
        eq(organizationIncidentTypes.incidentTypeId, incidentTypes.id),
      )
      .where(
        and(
          eq(organizationIncidentTypes.organizationId, organizationId),
          eq(organizationIncidentTypes.isEnabled, true),
        ),
      )
      .orderBy(asc(incidentTypes.name));

    return organizationTypes as OrganizationIncidentTypeRecord[];
  }

  async getAvailableIncidentTypes(
    organizationId: string,
  ): Promise<AvailableIncidentTypeRecord[]> {
    const availableTypes = await this.database
      .select({
        id: incidentTypes.id,
        name: incidentTypes.name,
        description: incidentTypes.description,
        color: incidentTypes.color,
        isActive: incidentTypes.isActive,
        createdAt: incidentTypes.createdAt,
        updatedAt: incidentTypes.updatedAt,
      })
      .from(incidentTypes)
      .where(
        and(
          eq(incidentTypes.isActive, true),
          sql`${incidentTypes.id} NOT IN (
              SELECT incident_type_id 
              FROM organization_incident_types 
              WHERE organization_id = ${organizationId} 
              AND is_enabled = true
            )`,
        ),
      )
      .orderBy(asc(incidentTypes.name));

    return availableTypes as AvailableIncidentTypeRecord[];
  }

  async findActiveIncidentTypeById(
    incidentTypeId: string,
  ): Promise<AvailableIncidentTypeRecord | null> {
    const [incidentType] = await this.database
      .select({
        id: incidentTypes.id,
        name: incidentTypes.name,
        description: incidentTypes.description,
        color: incidentTypes.color,
        isActive: incidentTypes.isActive,
        createdAt: incidentTypes.createdAt,
        updatedAt: incidentTypes.updatedAt,
      })
      .from(incidentTypes)
      .where(
        and(
          eq(incidentTypes.id, incidentTypeId),
          eq(incidentTypes.isActive, true),
        ),
      )
      .limit(1);

    return (incidentType as AvailableIncidentTypeRecord) ?? null;
  }

  async findIncidentTypeByNameInsensitive(
    name: string,
  ): Promise<AvailableIncidentTypeRecord | null> {
    const [incidentType] = await this.database
      .select({
        id: incidentTypes.id,
        name: incidentTypes.name,
        description: incidentTypes.description,
        color: incidentTypes.color,
        isActive: incidentTypes.isActive,
        createdAt: incidentTypes.createdAt,
        updatedAt: incidentTypes.updatedAt,
      })
      .from(incidentTypes)
      .where(sql`LOWER(${incidentTypes.name}) = LOWER(${name})`)
      .limit(1);

    return (incidentType as AvailableIncidentTypeRecord) ?? null;
  }

  async isIncidentTypeEnabledForOrganization(
    input: IncidentTypeActionInput,
  ): Promise<boolean> {
    const [existing] = await this.database
      .select({ id: organizationIncidentTypes.id })
      .from(organizationIncidentTypes)
      .where(
        and(
          eq(
            organizationIncidentTypes.organizationId,
            input.actor.organizationId!,
          ),
          eq(organizationIncidentTypes.incidentTypeId, input.incidentTypeId),
          eq(organizationIncidentTypes.isEnabled, true),
        ),
      )
      .limit(1);

    return Boolean(existing);
  }

  async enableIncidentTypeForOrganization(
    input: IncidentTypeActionInput,
  ): Promise<void> {
    await this.database.insert(organizationIncidentTypes).values({
      organizationId: input.actor.organizationId!,
      incidentTypeId: input.incidentTypeId,
      isEnabled: true,
    });
  }

  async createIncidentType(
    input: CreateIncidentTypeInput,
  ): Promise<AvailableIncidentTypeRecord> {
    const [newIncidentType] = await this.database
      .insert(incidentTypes)
      .values({
        name: input.name.trim(),
        description: input.description?.trim(),
        color: input.color,
        isActive: true,
      })
      .returning({
        id: incidentTypes.id,
        name: incidentTypes.name,
        description: incidentTypes.description,
        color: incidentTypes.color,
        isActive: incidentTypes.isActive,
        createdAt: incidentTypes.createdAt,
        updatedAt: incidentTypes.updatedAt,
      });

    return newIncidentType as AvailableIncidentTypeRecord;
  }

  async getOrganizationIncidentTypeLinkId(
    input: IncidentTypeActionInput,
  ): Promise<string | null> {
    const [orgIncidentType] = await this.database
      .select({ id: organizationIncidentTypes.id })
      .from(organizationIncidentTypes)
      .where(
        and(
          eq(
            organizationIncidentTypes.organizationId,
            input.actor.organizationId!,
          ),
          eq(organizationIncidentTypes.incidentTypeId, input.incidentTypeId),
          eq(organizationIncidentTypes.isEnabled, true),
        ),
      )
      .limit(1);

    return orgIncidentType?.id ?? null;
  }

  async disableIncidentTypeForOrganization(linkId: string): Promise<void> {
    await this.database
      .update(organizationIncidentTypes)
      .set({
        isEnabled: false,
        updatedAt: new Date(),
      })
      .where(eq(organizationIncidentTypes.id, linkId));
  }

  async getOrganizationRecentIncidents(input: {
    organizationId: string;
    limit: number;
  }): Promise<AdminDashboardRecentIncidentItem[]> {
    const recentIncidents = await this.database
      .select({
        id: incidents.id,
        title: sql<string>`CASE 
              WHEN ${incidents.data}->>'incidentType' IS NOT NULL 
              THEN ${incidents.data}->>'incidentType'
              ELSE 'Incident'
            END`,
        status: incidents.status,
        date: incidents.createdAt,
        type: sql<string>`CASE 
              WHEN ${incidents.data}->>'incidentType' IS NOT NULL 
              THEN ${incidents.data}->>'incidentType'
              ELSE 'General Incident'
            END`,
      })
      .from(incidents)
      .where(eq(incidents.organizationId, input.organizationId))
      .orderBy(desc(incidents.createdAt))
      .limit(input.limit);

    return recentIncidents.map((incident) => ({
      id: incident.id,
      title: incident.title,
      status: incident.status as AdminDashboardRecentIncidentItem["status"],
      date: this.formatRelativeTime(incident.date),
      type: incident.type,
      href: `/admin/incidents/${incident.id}`,
    }));
  }

  async getOrganizationPendingReports(input: {
    organizationId: string;
    limit: number;
  }): Promise<AdminDashboardPendingReportItem[]> {
    const pendingReports = await this.database
      .select({
        id: reports.id,
        title: reports.title,
        status: reports.status,
        date: reports.updatedAt,
        type: sql<string>`'Report'`,
      })
      .from(reports)
      .where(
        and(
          eq(reports.organizationId, input.organizationId),
          eq(reports.status, "draft"),
        ),
      )
      .orderBy(desc(reports.updatedAt))
      .limit(input.limit);

    return pendingReports.map((report) => ({
      id: report.id,
      title: report.title,
      status: report.status as AdminDashboardPendingReportItem["status"],
      date: this.formatRelativeTime(report.date),
      type: report.type,
      href: `/admin/reports/${report.id}`,
    }));
  }

  async getOrganizationIncidentTypesAnalytics(
    organizationId: string,
  ): Promise<AdminIncidentTypeAnalyticsItem[]> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const incidentTypesData = await this.database
      .select({
        incidentType: sql<string>`
            CASE 
              WHEN ${incidents.data}->>'incidentType' IS NOT NULL 
              THEN ${incidents.data}->>'incidentType'
              ELSE 'Other'
            END
          `,
        count: count(incidents.id),
      })
      .from(incidents)
      .where(
        and(
          eq(incidents.organizationId, organizationId),
          gte(incidents.createdAt, startOfMonth),
        ),
      )
      .groupBy(
        sql`
          CASE 
            WHEN ${incidents.data}->>'incidentType' IS NOT NULL 
            THEN ${incidents.data}->>'incidentType'
            ELSE 'Other'
          END
        `,
      )
      .orderBy(desc(count(incidents.id)));

    return incidentTypesData.map((item) => ({
      name: item.incidentType,
      value: item.count,
    }));
  }

  async getOrganizationWeeklyIncidentTrend(
    organizationId: string,
  ): Promise<AdminWeeklyIncidentTrend> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklyData = await this.database
      .select({
        date: sql<string>`DATE(${incidents.createdAt})`,
        count: count(incidents.id),
      })
      .from(incidents)
      .where(
        and(
          eq(incidents.organizationId, organizationId),
          gte(incidents.createdAt, sevenDaysAgo),
        ),
      )
      .groupBy(sql`DATE(${incidents.createdAt})`)
      .orderBy(sql`DATE(${incidents.createdAt})`);

    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const result = [];

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date();
      currentDate.setDate(currentDate.getDate() - (6 - i));
      const dateString = currentDate.toISOString().split("T")[0];
      const dayName = daysOfWeek[currentDate.getDay()];

      const dataForDay = weeklyData.find((item) => item.date === dateString);
      result.push({
        period: dayName,
        value: dataForDay ? dataForDay.count : 0,
      });
    }

    const currentWeekTotal = result.reduce((sum, day) => sum + day.value, 0);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const previousWeekData = await this.database
      .select({
        count: count(incidents.id),
      })
      .from(incidents)
      .where(
        and(
          eq(incidents.organizationId, organizationId),
          gte(incidents.createdAt, fourteenDaysAgo),
          lt(incidents.createdAt, sevenDaysAgo),
        ),
      );

    const previousWeekTotal = previousWeekData[0]?.count || 0;
    const percentageChange =
      previousWeekTotal > 0
        ? ((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100
        : currentWeekTotal > 0
          ? 100
          : 0;

    return {
      data: result,
      currentValue: currentWeekTotal,
      currentChange: Math.round(percentageChange * 10) / 10,
      timeframe: "7d",
    };
  }

  private formatRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
      return "Just now";
    }
    if (minutes < 60) {
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    }
    if (hours < 24) {
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    }
    if (days < 7) {
      return `${days} day${days > 1 ? "s" : ""} ago`;
    }
    return date.toLocaleDateString();
  }
}
