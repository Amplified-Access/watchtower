import { db as defaultDb } from "@/db";
import { incidentTypes } from "@/db/schemas/incident-types";
import { organizationIncidentReports } from "@/db/schemas/organization-incident-reports";
import { organizationIncidentTypes } from "@/db/schemas/organization-incident-types";
import { and, count, desc, eq, sql, sum } from "drizzle-orm";
import type {
  OrganizationIncidentAggregate,
  OrganizationIncidentDraft,
  OrganizationIncidentFilters,
  OrganizationIncidentReport,
  OrganizationIncidentStats,
  UserOrganizationIncidentFilters,
} from "../../domain/organization-incident-report";
import type { OrganizationReportingRepository } from "../../domain/organization-reporting-repository";

export class DrizzleOrganizationReportingRepository implements OrganizationReportingRepository {
  constructor(private readonly database = defaultDb) {}

  async isIncidentTypeEnabledForOrganization(params: {
    organizationId: string;
    incidentTypeId: string;
  }): Promise<boolean> {
    const enabledType = await this.database
      .select({ id: organizationIncidentTypes.id })
      .from(organizationIncidentTypes)
      .where(
        and(
          eq(organizationIncidentTypes.organizationId, params.organizationId),
          eq(organizationIncidentTypes.incidentTypeId, params.incidentTypeId),
          eq(organizationIncidentTypes.isEnabled, true),
        ),
      )
      .limit(1);

    return enabledType.length > 0;
  }

  async createIncidentReport(report: OrganizationIncidentDraft): Promise<void> {
    await this.database.insert(organizationIncidentReports).values({
      organizationId: report.organizationId,
      reportedByUserId: report.reportedByUserId,
      incidentTypeId: report.incidentTypeId,
      location: report.location,
      description: report.description,
      entities: report.entities,
      injuries: report.injuries,
      fatalities: report.fatalities,
      severity: report.severity,
    });
  }

  async getOrganizationIncidentReports(params: {
    organizationId: string;
    filters: OrganizationIncidentFilters;
  }): Promise<OrganizationIncidentAggregate[]> {
    const whereConditions = [
      eq(organizationIncidentReports.organizationId, params.organizationId),
    ];

    if (params.filters.country) {
      whereConditions.push(
        sql`LOWER(${organizationIncidentReports.location} ->> 'country') = LOWER(${params.filters.country})`,
      );
    }

    if (params.filters.category) {
      whereConditions.push(eq(incidentTypes.name, params.filters.category));
    }

    if (params.filters.severity) {
      whereConditions.push(
        eq(organizationIncidentReports.severity, params.filters.severity),
      );
    }

    if (params.filters.verified !== undefined) {
      whereConditions.push(
        eq(organizationIncidentReports.verified, params.filters.verified),
      );
    }

    if (params.filters.search) {
      const searchValue = params.filters.search.toLowerCase();
      whereConditions.push(
        sql`(
          LOWER(${organizationIncidentReports.location} ->> 'admin1') LIKE ${`%${searchValue}%`} OR
          LOWER(${organizationIncidentReports.location} ->> 'country') LIKE ${`%${searchValue}%`} OR
          LOWER(${organizationIncidentReports.location} ->> 'display_name') LIKE ${`%${searchValue}%`} OR
          LOWER(${incidentTypes.name}) LIKE ${`%${searchValue}%`} OR
          LOWER(${organizationIncidentReports.description}) LIKE ${`%${searchValue}%`}
        )`,
      );
    }

    const response = await this.database
      .select({
        region: sql<
          string | null
        >`${organizationIncidentReports.location} ->> 'region'`,
        country: sql<
          string | null
        >`${organizationIncidentReports.location} ->> 'country'`,
        totalFatalities: sum(organizationIncidentReports.fatalities),
        totalInjuries: sum(organizationIncidentReports.injuries),
        totalReports: count(organizationIncidentReports.id),
        lat: sql<
          number | null
        >`CAST(${organizationIncidentReports.location} ->> 'lat' AS DOUBLE PRECISION)`,
        lon: sql<
          number | null
        >`CAST(${organizationIncidentReports.location} ->> 'lon' AS DOUBLE PRECISION)`,
        displayName: sql<
          string | null
        >`${organizationIncidentReports.location} ->> 'admin1'`,
        incidentTypes: sql<
          string | null
        >`string_agg(DISTINCT ${incidentTypes.name}, ', ')`,
        incidentTypeColor: sql<string | null>`MAX(${incidentTypes.color})`,
        severity: sql<
          string | null
        >`MAX(${organizationIncidentReports.severity})`,
        verified: sql<boolean>`BOOL_OR(${organizationIncidentReports.verified})`,
        source: sql<string>`'organization'`,
      })
      .from(organizationIncidentReports)
      .leftJoin(
        incidentTypes,
        eq(organizationIncidentReports.incidentTypeId, incidentTypes.id),
      )
      .where(and(...whereConditions))
      .groupBy(
        sql`${organizationIncidentReports.location} ->> 'region'`,
        sql`${organizationIncidentReports.location} ->> 'country'`,
        sql`${organizationIncidentReports.location} ->> 'lat'`,
        sql`${organizationIncidentReports.location} ->> 'lon'`,
        sql`${organizationIncidentReports.location} ->> 'admin1'`,
      )
      .limit(params.filters.limit)
      .offset(params.filters.offset)
      .orderBy(desc(sql`count(${organizationIncidentReports.id})`));

    return response;
  }

  async getUserOrganizationIncidentReports(params: {
    organizationId: string;
    userId: string;
    filters: UserOrganizationIncidentFilters;
  }): Promise<OrganizationIncidentReport[]> {
    const whereConditions = [
      eq(organizationIncidentReports.reportedByUserId, params.userId),
      eq(organizationIncidentReports.organizationId, params.organizationId),
    ];

    if (params.filters.search) {
      const searchValue = params.filters.search.toLowerCase();
      whereConditions.push(
        sql`(
          LOWER(${organizationIncidentReports.location} ->> 'admin1') LIKE ${`%${searchValue}%`} OR
          LOWER(${organizationIncidentReports.location} ->> 'country') LIKE ${`%${searchValue}%`} OR
          LOWER(${organizationIncidentReports.location} ->> 'display_name') LIKE ${`%${searchValue}%`} OR
          LOWER(${incidentTypes.name}) LIKE ${`%${searchValue}%`} OR
          LOWER(${organizationIncidentReports.description}) LIKE ${`%${searchValue}%`}
        )`,
      );
    }

    const reports = await this.database
      .select({
        id: organizationIncidentReports.id,
        organizationId: organizationIncidentReports.organizationId,
        reportedByUserId: organizationIncidentReports.reportedByUserId,
        incidentTypeId: organizationIncidentReports.incidentTypeId,
        incidentTypeName: incidentTypes.name,
        location: organizationIncidentReports.location,
        description: organizationIncidentReports.description,
        entities: organizationIncidentReports.entities,
        injuries: organizationIncidentReports.injuries,
        fatalities: organizationIncidentReports.fatalities,
        severity: organizationIncidentReports.severity,
        verified: organizationIncidentReports.verified,
        createdAt: organizationIncidentReports.createdAt,
        updatedAt: organizationIncidentReports.updatedAt,
      })
      .from(organizationIncidentReports)
      .leftJoin(
        incidentTypes,
        eq(organizationIncidentReports.incidentTypeId, incidentTypes.id),
      )
      .where(and(...whereConditions))
      .orderBy(desc(organizationIncidentReports.createdAt))
      .limit(params.filters.limit)
      .offset(params.filters.offset);

    return reports as OrganizationIncidentReport[];
  }

  async getOrganizationIncidentStats(
    organizationId: string,
  ): Promise<OrganizationIncidentStats | null> {
    const stats = await this.database
      .select({
        totalReports: count(organizationIncidentReports.id),
        totalFatalities: sum(organizationIncidentReports.fatalities),
        totalInjuries: sum(organizationIncidentReports.injuries),
        verifiedReports: sql<number>`COUNT(CASE WHEN ${organizationIncidentReports.verified} = true THEN 1 END)`,
        unverifiedReports: sql<number>`COUNT(CASE WHEN ${organizationIncidentReports.verified} = false THEN 1 END)`,
        criticalReports: sql<number>`COUNT(CASE WHEN ${organizationIncidentReports.severity} = 'critical' THEN 1 END)`,
        highSeverityReports: sql<number>`COUNT(CASE WHEN ${organizationIncidentReports.severity} = 'high' THEN 1 END)`,
      })
      .from(organizationIncidentReports)
      .where(eq(organizationIncidentReports.organizationId, organizationId));

    return stats[0] ?? null;
  }
}
