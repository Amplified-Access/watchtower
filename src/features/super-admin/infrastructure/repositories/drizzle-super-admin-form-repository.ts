import { db as defaultDb } from "@/db";
import { user } from "@/db/schemas/auth";
import { forms } from "@/db/schemas/forms";
import { incidents } from "@/db/schemas/incidents";
import { organizationApplications } from "@/db/schemas/organization-applications";
import { organizations } from "@/db/schemas/organizations";
import { reports } from "@/db/schemas/reports";
import { and, asc, count, desc, eq, or, sql } from "drizzle-orm";
import type { SuperAdminFormRepository } from "../../domain/super-admin-form-repository";
import type {
  GetAllIncidentsForSuperAdminInput,
  GetAllFormsForSuperAdminInput,
  GetAllReportsForSuperAdminInput,
  GetCriticalIncidentsForSuperAdminInput,
  GetPendingApplicationsForSuperAdminInput,
  GetRecentActivityForSuperAdminInput,
  SuperAdminCriticalIncidentItem,
  SuperAdminIncidentRecord,
  SuperAdminDashboardStats,
  SuperAdminFormRecord,
  SuperAdminFormWithIncidentCount,
  SuperAdminOrganizationTypeDistributionItem,
  SuperAdminPendingApplicationItem,
  SuperAdminPlatformActivityTrend,
  SuperAdminRecentActivityItem,
  SuperAdminReportRecord,
  SuperAdminUserDirectoryRecord,
  UpdateIncidentStatusForSuperAdminInput,
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
        input.sortOrder === "desc"
          ? desc(forms.createdAt)
          : asc(forms.createdAt);
    } else if (input.sortBy === "updatedAt") {
      orderByClause =
        input.sortOrder === "desc"
          ? desc(forms.updatedAt)
          : asc(forms.updatedAt);
    } else {
      orderByClause =
        input.sortOrder === "desc" ? desc(forms.name) : asc(forms.name);
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
          formName.includes(searchLower) ||
          organizationName.includes(searchLower)
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

    await this.database
      .update(forms)
      .set(updateData)
      .where(eq(forms.id, input.formId));
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

  async getAllIncidents(input: GetAllIncidentsForSuperAdminInput) {
    const whereConditions = [];

    if (input.organizationId) {
      whereConditions.push(eq(incidents.organizationId, input.organizationId));
    }

    if (input.formId) {
      whereConditions.push(eq(incidents.formId, input.formId));
    }

    if (input.status) {
      whereConditions.push(eq(incidents.status, input.status));
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
        organizationName: organizations.name,
        reporterEmail: user.email,
      })
      .from(incidents)
      .leftJoin(forms, eq(incidents.formId, forms.id))
      .leftJoin(organizations, eq(incidents.organizationId, organizations.id))
      .leftJoin(user, eq(incidents.reportedByUserId, user.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(orderByClause)
      .limit(input.limit)
      .offset(input.offset);

    let filteredData = data;
    if (input.search) {
      const searchLower = input.search.toLowerCase();
      filteredData = data.filter((incident) => {
        const dataString = JSON.stringify(incident.data).toLowerCase();
        const formName = (incident.formName || "").toLowerCase();
        const organizationName = (
          incident.organizationName || ""
        ).toLowerCase();
        const reporterEmail = (incident.reporterEmail || "").toLowerCase();

        return (
          dataString.includes(searchLower) ||
          formName.includes(searchLower) ||
          organizationName.includes(searchLower) ||
          reporterEmail.includes(searchLower) ||
          incident.status.toLowerCase().includes(searchLower)
        );
      });
    }

    const totalCountResult = await this.database
      .select({ count: count() })
      .from(incidents)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    const totalCount = totalCountResult[0]?.count || 0;

    return {
      incidents: filteredData as SuperAdminIncidentRecord[],
      totalCount,
      hasMore: input.offset + filteredData.length < totalCount,
    };
  }

  async getIncidentById(
    incidentId: string,
  ): Promise<SuperAdminIncidentRecord | null> {
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
        organizationName: organizations.name,
        reporterEmail: user.email,
      })
      .from(incidents)
      .leftJoin(forms, eq(incidents.formId, forms.id))
      .leftJoin(organizations, eq(incidents.organizationId, organizations.id))
      .leftJoin(user, eq(incidents.reportedByUserId, user.id))
      .where(eq(incidents.id, incidentId))
      .limit(1);

    return (incident as SuperAdminIncidentRecord) ?? null;
  }

  async updateIncidentStatus(
    input: UpdateIncidentStatusForSuperAdminInput,
  ): Promise<void> {
    await this.database
      .update(incidents)
      .set({
        status: input.status,
        updatedAt: new Date(),
      })
      .where(eq(incidents.id, input.incidentId));
  }

  async deleteIncident(incidentId: string): Promise<void> {
    await this.database.delete(incidents).where(eq(incidents.id, incidentId));
  }

  async getAllReports(input: GetAllReportsForSuperAdminInput) {
    const whereConditions = [];

    if (input.organizationId) {
      whereConditions.push(eq(reports.organizationId, input.organizationId));
    }

    if (input.status !== "all") {
      whereConditions.push(eq(reports.status, input.status));
    }

    let orderByClause;
    if (input.sortBy === "createdAt") {
      orderByClause =
        input.sortOrder === "desc"
          ? desc(reports.createdAt)
          : asc(reports.createdAt);
    } else if (input.sortBy === "updatedAt") {
      orderByClause =
        input.sortOrder === "desc"
          ? desc(reports.updatedAt)
          : asc(reports.updatedAt);
    } else {
      orderByClause =
        input.sortOrder === "desc" ? desc(reports.title) : asc(reports.title);
    }

    const data = await this.database
      .select({
        id: reports.id,
        organizationId: reports.organizationId,
        reportedById: reports.reportedById,
        title: reports.title,
        fileKey: reports.fileKey,
        status: reports.status,
        createdAt: reports.createdAt,
        updatedAt: reports.updatedAt,
        authorName: user.name,
        authorEmail: user.email,
        organizationName: organizations.name,
      })
      .from(reports)
      .leftJoin(user, eq(reports.reportedById, user.id))
      .leftJoin(organizations, eq(reports.organizationId, organizations.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(orderByClause)
      .limit(input.limit)
      .offset(input.offset);

    let filteredData = data;
    if (input.search) {
      const searchLower = input.search.toLowerCase();
      filteredData = data.filter((report) => {
        const title = (report.title || "").toLowerCase();
        const organizationName = (report.organizationName || "").toLowerCase();
        const authorName = (report.authorName || "").toLowerCase();

        return (
          title.includes(searchLower) ||
          organizationName.includes(searchLower) ||
          authorName.includes(searchLower)
        );
      });
    }

    const totalCountResult = await this.database
      .select({ count: count() })
      .from(reports)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    const totalCount = totalCountResult[0]?.count || 0;

    return {
      reports: filteredData as SuperAdminReportRecord[],
      totalCount,
      hasMore: input.offset + filteredData.length < totalCount,
    };
  }

  async getDashboardStats(): Promise<SuperAdminDashboardStats> {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [organizationsCount] = await this.database
      .select({ count: count() })
      .from(organizations);

    const [adminsCount] = await this.database
      .select({ count: count() })
      .from(user)
      .where(eq(user.role, "admin"));

    const [watchersCount] = await this.database
      .select({ count: count() })
      .from(user)
      .where(eq(user.role, "watcher"));

    const [organizationsThisMonth] = await this.database
      .select({ count: count() })
      .from(organizations)
      .where(sql`${organizations.createdAt} >= ${currentMonth}`);

    const [organizationsLastMonth] = await this.database
      .select({ count: count() })
      .from(organizations)
      .where(
        and(
          sql`${organizations.createdAt} >= ${lastMonth}`,
          sql`${organizations.createdAt} < ${currentMonth}`,
        ),
      );

    const [adminsThisMonth] = await this.database
      .select({ count: count() })
      .from(user)
      .where(
        and(eq(user.role, "admin"), sql`${user.createdAt} >= ${currentMonth}`),
      );

    const [adminsLastMonth] = await this.database
      .select({ count: count() })
      .from(user)
      .where(
        and(
          eq(user.role, "admin"),
          sql`${user.createdAt} >= ${lastMonth}`,
          sql`${user.createdAt} < ${currentMonth}`,
        ),
      );

    const [watchersThisMonth] = await this.database
      .select({ count: count() })
      .from(user)
      .where(
        and(
          eq(user.role, "watcher"),
          sql`${user.createdAt} >= ${currentMonth}`,
        ),
      );

    const [watchersLastMonth] = await this.database
      .select({ count: count() })
      .from(user)
      .where(
        and(
          eq(user.role, "watcher"),
          sql`${user.createdAt} >= ${lastMonth}`,
          sql`${user.createdAt} < ${currentMonth}`,
        ),
      );

    const [pendingApplicationsCount] = await this.database
      .select({ count: count() })
      .from(organizationApplications)
      .where(eq(organizationApplications.status, "pending"));

    const [reportsThisMonth] = await this.database
      .select({ count: count() })
      .from(reports)
      .where(sql`${reports.createdAt} >= ${currentMonth}`);

    const [formsCount] = await this.database
      .select({ count: count() })
      .from(forms);

    const [criticalIncidentsCount] = await this.database
      .select({ count: count() })
      .from(incidents)
      .where(
        or(
          eq(incidents.status, "reported"),
          eq(incidents.status, "investigating"),
        ),
      );

    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) {
        return current > 0 ? 100 : 0;
      }
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      totalOrganizations: organizationsCount.count,
      totalAdmins: adminsCount.count,
      totalWatchers: watchersCount.count,
      pendingApplications: pendingApplicationsCount.count,
      reportsThisMonth: reportsThisMonth.count,
      activeForms: formsCount.count,
      criticalIncidents: criticalIncidentsCount.count,
      uptimePercentage: 99.9,
      growth: {
        organizations: {
          current: organizationsThisMonth.count,
          previous: organizationsLastMonth.count,
          percentage: calculateGrowth(
            organizationsThisMonth.count,
            organizationsLastMonth.count,
          ),
        },
        admins: {
          current: adminsThisMonth.count,
          previous: adminsLastMonth.count,
          percentage: calculateGrowth(
            adminsThisMonth.count,
            adminsLastMonth.count,
          ),
        },
        watchers: {
          current: watchersThisMonth.count,
          previous: watchersLastMonth.count,
          percentage: calculateGrowth(
            watchersThisMonth.count,
            watchersLastMonth.count,
          ),
        },
      },
      metrics: {
        newOrganizationsThisMonth: organizationsThisMonth.count,
        newAdminsThisMonth: adminsThisMonth.count,
        newWatchersThisMonth: watchersThisMonth.count,
        averageReportsPerOrg:
          organizationsCount.count > 0
            ? Math.round(
                (reportsThisMonth.count / organizationsCount.count) * 10,
              ) / 10
            : 0,
      },
    };
  }

  async getRecentActivity(
    input: GetRecentActivityForSuperAdminInput,
  ): Promise<SuperAdminRecentActivityItem[]> {
    const recentApplications = await this.database
      .select({
        id: organizationApplications.id,
        title: organizationApplications.organizationName,
        type: sql`'application'`.as("type"),
        status: organizationApplications.status,
        createdAt: organizationApplications.createdAt,
        description:
          sql`CONCAT('Organization application from ', ${organizationApplications.applicantName})`.as(
            "description",
          ),
      })
      .from(organizationApplications)
      .orderBy(desc(organizationApplications.createdAt))
      .limit(3);

    const recentIncidents = await this.database
      .select({
        id: incidents.id,
        title: sql`'Incident Report'`.as("title"),
        type: sql`'incident'`.as("type"),
        status: incidents.status,
        createdAt: incidents.createdAt,
        description: sql`'Security incident reported'`.as("description"),
      })
      .from(incidents)
      .orderBy(desc(incidents.createdAt))
      .limit(3);

    const recentReports = await this.database
      .select({
        id: reports.id,
        title: reports.title,
        type: sql`'report'`.as("type"),
        status: reports.status,
        createdAt: reports.createdAt,
        description: sql`CONCAT('Report published: ', ${reports.title})`.as(
          "description",
        ),
      })
      .from(reports)
      .where(eq(reports.status, "published"))
      .orderBy(desc(reports.createdAt))
      .limit(3);

    const recentUsers = await this.database
      .select({
        id: user.id,
        title: user.name,
        type: user.role,
        status: sql`'active'`.as("status"),
        createdAt: user.createdAt,
        description:
          sql`CONCAT(${user.role}, ' user added: ', ${user.name})`.as(
            "description",
          ),
      })
      .from(user)
      .where(or(eq(user.role, "admin"), eq(user.role, "watcher")))
      .orderBy(desc(user.createdAt))
      .limit(2);

    const allActivities = [
      ...recentApplications,
      ...recentIncidents,
      ...recentReports,
      ...recentUsers,
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return allActivities.slice(0, input.limit).map((activity) => ({
      id: String(activity.id),
      title: String(activity.title || "Unknown Activity"),
      description: String(activity.description),
      timestamp: this.formatTimeAgo(new Date(activity.createdAt)),
      type: String(activity.type) as SuperAdminRecentActivityItem["type"],
      status: String(activity.status),
      href: this.getActivityHref(String(activity.type), String(activity.id)),
    }));
  }

  async getPendingApplications(
    input: GetPendingApplicationsForSuperAdminInput,
  ): Promise<SuperAdminPendingApplicationItem[]> {
    const pendingApplications = await this.database
      .select({
        id: organizationApplications.id,
        title: organizationApplications.organizationName,
        status: organizationApplications.status,
        createdAt: organizationApplications.createdAt,
      })
      .from(organizationApplications)
      .where(eq(organizationApplications.status, "pending"))
      .orderBy(desc(organizationApplications.createdAt))
      .limit(input.limit);

    return pendingApplications.map((app) => ({
      id: String(app.id),
      title: app.title,
      status: app.status,
      date: this.formatTimeAgo(new Date(app.createdAt)),
      type: "Organization Application",
      href: `/superadmin/applications/${app.id}`,
    }));
  }

  async getCriticalIncidents(
    input: GetCriticalIncidentsForSuperAdminInput,
  ): Promise<SuperAdminCriticalIncidentItem[]> {
    const criticalIncidents = await this.database
      .select({
        id: incidents.id,
        title: sql`'Security Incident'`.as("title"),
        status: incidents.status,
        createdAt: incidents.createdAt,
      })
      .from(incidents)
      .where(
        or(
          eq(incidents.status, "reported"),
          eq(incidents.status, "investigating"),
        ),
      )
      .orderBy(desc(incidents.createdAt))
      .limit(input.limit);

    return criticalIncidents.map((incident) => ({
      id: String(incident.id),
      title: String(incident.title),
      status: incident.status as SuperAdminCriticalIncidentItem["status"],
      date: this.formatTimeAgo(new Date(incident.createdAt)),
      type: "Security Incident",
      href: `/superadmin/incidents/${incident.id}`,
    }));
  }

  async getOrganizationTypeDistribution(): Promise<
    SuperAdminOrganizationTypeDistributionItem[]
  > {
    const organizationsByLocation = await this.database
      .select({
        type: organizations.location,
        count: count(),
      })
      .from(organizations)
      .groupBy(organizations.location);

    return organizationsByLocation
      .filter((item) => item.type)
      .map((item) => ({
        name: item.type || "Unknown",
        value: item.count,
      }));
  }

  async getPlatformActivityTrend(): Promise<SuperAdminPlatformActivityTrend> {
    const weeks = [];
    for (let i = 6; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - i * 7);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const [reportsCount] = await this.database
        .select({ count: count() })
        .from(reports)
        .where(
          and(
            sql`${reports.createdAt} >= ${weekStart}`,
            sql`${reports.createdAt} < ${weekEnd}`,
          ),
        );

      const [incidentsCount] = await this.database
        .select({ count: count() })
        .from(incidents)
        .where(
          and(
            sql`${incidents.createdAt} >= ${weekStart}`,
            sql`${incidents.createdAt} < ${weekEnd}`,
          ),
        );

      const [applicationsCount] = await this.database
        .select({ count: count() })
        .from(organizationApplications)
        .where(
          and(
            sql`${organizationApplications.createdAt} >= ${weekStart}`,
            sql`${organizationApplications.createdAt} < ${weekEnd}`,
          ),
        );

      const totalActivity =
        reportsCount.count + incidentsCount.count + applicationsCount.count;

      weeks.push({
        period: `Week ${7 - i}`,
        value: totalActivity,
      });
    }

    const currentValue = weeks[weeks.length - 1]?.value || 0;
    const previousValue = weeks[weeks.length - 2]?.value || 0;
    const currentChange =
      previousValue > 0
        ? ((currentValue - previousValue) / previousValue) * 100
        : 0;

    return {
      data: weeks,
      currentValue,
      currentChange: Math.round(currentChange * 10) / 10,
      timeframe: "30d",
    };
  }

  async getAllAdmins(): Promise<SuperAdminUserDirectoryRecord[]> {
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
      .where(eq(user.role, "admin"));

    return data as SuperAdminUserDirectoryRecord[];
  }

  async getAllWatchers(): Promise<SuperAdminUserDirectoryRecord[]> {
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
      .where(eq(user.role, "watcher"));

    return data as SuperAdminUserDirectoryRecord[];
  }

  private formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return "Just now";
    }
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    }

    return date.toLocaleDateString();
  }

  private getActivityHref(type: string, id: string): string {
    switch (type) {
      case "application":
        return `/superadmin/applications/${id}`;
      case "incident":
        return `/superadmin/incidents/${id}`;
      case "report":
        return `/superadmin/reports/${id}`;
      case "admin":
      case "watcher":
        return `/superadmin/admin-management`;
      default:
        return "/superadmin";
    }
  }
}
