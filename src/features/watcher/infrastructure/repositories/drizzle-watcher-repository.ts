import { db as defaultDb } from "@/db";
import { user } from "@/db/schemas/auth";
import { forms } from "@/db/schemas/forms";
import { incidents } from "@/db/schemas/incidents";
import { organizations } from "@/db/schemas/organizations";
import { reports } from "@/db/schemas/reports";
import { and, count, desc, eq, or, sql } from "drizzle-orm";
import type { WatcherRepository } from "../../domain/watcher-repository";
import type {
  DashboardStats,
  OrganizationDetails,
  RecentActivityItem,
  SubmitIncidentInput,
  WatcherForm,
} from "../../domain/watcher-types";

export class DrizzleWatcherRepository implements WatcherRepository {
  constructor(private readonly database = defaultDb) {}

  async getUserOrganizationDetails(
    userId: string,
  ): Promise<OrganizationDetails | null> {
    const data = await this.database
      .select({
        organizationId: user.organizationId,
        organization: organizations.name,
        description: organizations.description,
        website: organizations.website,
        location: organizations.location,
        contactEmail: organizations.contactEmail,
      })
      .from(user)
      .leftJoin(organizations, eq(user.organizationId, organizations.id))
      .where(eq(user.id, userId));

    return data[0] ?? null;
  }

  async getFormById(formId: string): Promise<WatcherForm | null> {
    const [form] = await this.database
      .select()
      .from(forms)
      .where(eq(forms.id, formId))
      .limit(1);

    return (form as WatcherForm) ?? null;
  }

  async getActiveFormsForOrganization(
    organizationId: string,
  ): Promise<WatcherForm[]> {
    const activeForms = await this.database
      .select({
        id: forms.id,
        name: forms.name,
        definition: forms.definition,
        createdAt: forms.createdAt,
        updatedAt: forms.updatedAt,
      })
      .from(forms)
      .where(
        and(eq(forms.organizationId, organizationId), eq(forms.isActive, true)),
      )
      .orderBy(desc(forms.updatedAt));

    return activeForms as WatcherForm[];
  }

  async submitIncident(
    input: SubmitIncidentInput,
  ): Promise<{ incidentId: string }> {
    const [newIncident] = await this.database
      .insert(incidents)
      .values({
        organizationId: input.organizationId,
        formId: input.formId,
        reportedByUserId: input.actor.userId,
        data: input.data,
        status: "reported",
      })
      .returning({ id: incidents.id });

    return { incidentId: newIncident.id };
  }

  async getOrganizationDashboardStats(
    organizationId: string,
  ): Promise<DashboardStats> {
    const [incidentStats] = await this.database
      .select({
        total: count(incidents.id),
        open: sql<number>`COUNT(CASE WHEN ${incidents.status} = 'reported' THEN 1 END)`,
        investigating: sql<number>`COUNT(CASE WHEN ${incidents.status} = 'investigating' THEN 1 END)`,
        resolved: sql<number>`COUNT(CASE WHEN ${incidents.status} = 'resolved' THEN 1 END)`,
      })
      .from(incidents)
      .where(eq(incidents.organizationId, organizationId));

    const [reportStats] = await this.database
      .select({
        total: count(reports.id),
        draft: sql<number>`COUNT(CASE WHEN ${reports.status} = 'draft' THEN 1 END)`,
        published: sql<number>`COUNT(CASE WHEN ${reports.status} = 'published' THEN 1 END)`,
      })
      .from(reports)
      .where(eq(reports.organizationId, organizationId));

    const [formStats] = await this.database
      .select({
        total: count(forms.id),
        active: sql<number>`COUNT(CASE WHEN ${forms.isActive} = true THEN 1 END)`,
      })
      .from(forms)
      .where(eq(forms.organizationId, organizationId));

    const [watcherStats] = await this.database
      .select({ total: count(user.id) })
      .from(user)
      .where(
        and(eq(user.organizationId, organizationId), eq(user.role, "watcher")),
      );

    return {
      incidents: {
        total: incidentStats.total || 0,
        open: incidentStats.open || 0,
        investigating: incidentStats.investigating || 0,
        resolved: incidentStats.resolved || 0,
      },
      reports: {
        total: reportStats.total || 0,
        draft: reportStats.draft || 0,
        published: reportStats.published || 0,
      },
      forms: {
        total: formStats.total || 0,
        active: formStats.active || 0,
      },
      watchers: {
        total: watcherStats.total || 0,
      },
    };
  }

  async getOrganizationRecentActivity(
    organizationId: string,
    limit: number,
  ): Promise<RecentActivityItem[]> {
    const incidentLimit = Math.floor(limit / 2);

    const recentIncidents = await this.database
      .select({
        id: incidents.id,
        type: sql<string>`'incident'`,
        title: sql<string>`CASE
          WHEN ${incidents.data}->>'incidentType' IS NOT NULL
          THEN CONCAT(${incidents.data}->>'incidentType', ' incident reported')
          ELSE 'New incident reported'
        END`,
        description: sql<string>`CASE
          WHEN ${incidents.data}->>'description' IS NOT NULL
          THEN ${incidents.data}->>'description'
          ELSE 'No description provided'
        END`,
        status: incidents.status,
        createdAt: incidents.createdAt,
      })
      .from(incidents)
      .where(eq(incidents.organizationId, organizationId))
      .orderBy(desc(incidents.createdAt))
      .limit(incidentLimit);

    const recentReports = await this.database
      .select({
        id: reports.id,
        type: sql<string>`'report'`,
        title: reports.title,
        description: sql<string>`CASE
          WHEN ${reports.status} = 'published' THEN 'Report published'
          ELSE 'Report draft created'
        END`,
        status: reports.status,
        createdAt: reports.createdAt,
      })
      .from(reports)
      .where(eq(reports.organizationId, organizationId))
      .orderBy(desc(reports.createdAt))
      .limit(incidentLimit);

    const allActivity = [
      ...recentIncidents.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        timestamp: item.createdAt,
        type: item.type as "incident",
        status: item.status,
        href: `/admin/incidents/${item.id}`,
      })),
      ...recentReports.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        timestamp: item.createdAt,
        type: item.type as "report",
        status: item.status,
        href: `/admin/reports/${item.id}`,
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, limit);

    return allActivity;
  }
}
