import { db } from "@/db";
import { organizations } from "@/db/schemas/organizations";
import { reports } from "@/db/schemas/reports";
import { user } from "@/db/schemas/auth";
import { and, desc, eq, ilike } from "drizzle-orm";
import type { ReportCatalogRepository } from "../../domain/report-catalog-repository";
import type {
  GetPublicReportsInput,
  PublicReportDetails,
  PublicReportListItem,
} from "../../domain/report-catalog-types";

export class DrizzleReportCatalogRepository implements ReportCatalogRepository {
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
