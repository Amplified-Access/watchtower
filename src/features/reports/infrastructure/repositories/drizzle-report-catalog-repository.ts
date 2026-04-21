import { db } from "@/db";
import { organizations } from "@/db/schemas/organizations";
import { reports } from "@/db/schemas/reports";
import { user } from "@/db/schemas/auth";
import { and, count, desc, eq, ilike } from "drizzle-orm";
import type { ReportCatalogRepository } from "../../domain/report-catalog-repository";
import type {
  CreateReportInput,
  GetOrganizationReportsInput,
  GetPublicReportsInput,
  OrganizationReportDetails,
  OrganizationReportsResult,
  PublicReportDetails,
  PublicReportListItem,
  UpdateReportInput,
} from "../../domain/report-catalog-types";

export class DrizzleReportCatalogRepository implements ReportCatalogRepository {
  async createReport(input: CreateReportInput): Promise<{ reportId: string }> {
    const [newReport] = await db
      .insert(reports)
      .values({
        organizationId: input.organizationId,
        reportedById: input.reportedById,
        title: input.title,
        fileKey: input.fileKey,
        status: input.status,
      })
      .returning({ id: reports.id });

    return { reportId: newReport.id };
  }

  async getOrganizationReports(
    input: GetOrganizationReportsInput,
  ): Promise<OrganizationReportsResult> {
    const whereConditions = [eq(reports.organizationId, input.organizationId)];

    if (input.status !== "all") {
      whereConditions.push(eq(reports.status, input.status));
    }

    const data = await db
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
      })
      .from(reports)
      .leftJoin(user, eq(reports.reportedById, user.id))
      .where(and(...whereConditions))
      .orderBy(desc(reports.updatedAt))
      .limit(input.limit)
      .offset(input.offset);

    const [{ count: totalCountRaw }] = await db
      .select({ count: count() })
      .from(reports)
      .where(and(...whereConditions));

    const totalCount = Number(totalCountRaw ?? 0);

    return {
      reports: data,
      totalCount,
      hasMore: input.offset + data.length < totalCount,
    };
  }

  async getReportById(reportId: string): Promise<OrganizationReportDetails | null> {
    const [report] = await db
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
      .where(eq(reports.id, reportId))
      .limit(1);

    return report ?? null;
  }

  async updateReport(input: UpdateReportInput): Promise<void> {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    await db.update(reports).set(updateData).where(eq(reports.id, input.reportId));
  }

  async deleteReport(reportId: string): Promise<void> {
    await db.delete(reports).where(eq(reports.id, reportId));
  }

  async getPublicReports(
    input: GetPublicReportsInput,
  ): Promise<PublicReportListItem[]> {
    const whereConditions = [eq(reports.status, "published")];

    if (input.search) {
      whereConditions.push(ilike(reports.title, `%${input.search}%`));
    }

    return db
      .select({
        id: reports.id,
        title: reports.title,
        fileKey: reports.fileKey,
        createdAt: reports.createdAt,
        updatedAt: reports.updatedAt,
        authorName: user.name,
        organizationName: organizations.name,
        organizationSlug: organizations.slug,
      })
      .from(reports)
      .leftJoin(user, eq(reports.reportedById, user.id))
      .leftJoin(organizations, eq(reports.organizationId, organizations.id))
      .where(and(...whereConditions))
      .orderBy(desc(reports.updatedAt))
      .limit(input.limit)
      .offset(input.offset);
  }

  async getPublicReportById(reportId: string): Promise<PublicReportDetails | null> {
    const [report] = await db
      .select({
        id: reports.id,
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
      .where(and(eq(reports.id, reportId), eq(reports.status, "published")))
      .limit(1);

    return report ?? null;
  }
}
