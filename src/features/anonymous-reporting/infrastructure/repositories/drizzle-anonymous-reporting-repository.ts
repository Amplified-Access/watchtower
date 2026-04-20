import { db as defaultDb } from "@/db";
import { anonymousIncidentReports } from "@/db/schemas/anonymous-incident-reports";
import { incidentTypes } from "@/db/schemas/incident-types";
import { organizationIncidentReports } from "@/db/schemas/organization-incident-reports";
import { and, count, eq, sql, sum } from "drizzle-orm";
import type { AnonymousReportingRepository } from "../../domain/anonymous-reporting-repository";
import type {
  AfricawideHeatmapPoint,
  AnonymousIncidentReportDraft,
  AnonymousIncidentReportFilters,
  AnonymousReportLocationAggregate,
  CombinedIncidentReportAggregate,
  CombinedIncidentReportFilters,
  IncidentTypeDto,
} from "../../domain/anonymous-reporting.types";

export class DrizzleAnonymousReportingRepository
  implements AnonymousReportingRepository
{
  constructor(private readonly database = defaultDb) {}

  async getAllIncidentTypes(): Promise<IncidentTypeDto[]> {
    return this.database
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
      .where(eq(incidentTypes.isActive, true));
  }

  async getActiveIncidentTypesForMaps() {
    return this.database
      .select({
        id: incidentTypes.id,
        name: incidentTypes.name,
        description: incidentTypes.description,
        color: incidentTypes.color,
        isActive: incidentTypes.isActive,
        createdAt: incidentTypes.createdAt,
        updatedAt: incidentTypes.updatedAt,
        anonymousReportCount: sql`COUNT(DISTINCT ${anonymousIncidentReports.id})`,
        organizationReportCount: sql`COUNT(DISTINCT ${organizationIncidentReports.id})`,
        totalReportCount: sql`COUNT(DISTINCT ${anonymousIncidentReports.id}) + COUNT(DISTINCT ${organizationIncidentReports.id})`,
      })
      .from(incidentTypes)
      .leftJoin(
        anonymousIncidentReports,
        eq(incidentTypes.id, anonymousIncidentReports.incidentTypeId),
      )
      .leftJoin(
        organizationIncidentReports,
        eq(incidentTypes.id, organizationIncidentReports.incidentTypeId),
      )
      .where(eq(incidentTypes.isActive, true))
      .groupBy(
        incidentTypes.id,
        incidentTypes.name,
        incidentTypes.description,
        incidentTypes.color,
        incidentTypes.isActive,
        incidentTypes.createdAt,
        incidentTypes.updatedAt,
      )
      .having(
        sql`COUNT(DISTINCT ${anonymousIncidentReports.id}) + COUNT(DISTINCT ${organizationIncidentReports.id}) > 0`,
      );
  }

  async createAnonymousIncidentReport(
    input: AnonymousIncidentReportDraft,
  ): Promise<void> {
    const injuriesCount = input.injuries === "6+" ? 6 : Number.parseInt(input.injuries, 10);
    const fatalitiesCount =
      input.fatalities === "6+" ? 6 : Number.parseInt(input.fatalities, 10);

    await this.database.insert(anonymousIncidentReports).values({
      incidentTypeId: input.category,
      location: input.location,
      description: input.description,
      injuries: injuriesCount,
      fatalities: fatalitiesCount,
      entities: input.entities,
      evidenceFileKey: input.evidenceFileKey || null,
      audioFileKey: input.audioFileKey || null,
    });
  }

  async getAllAnonymousIncidentReports(
    filters: AnonymousIncidentReportFilters,
  ): Promise<AnonymousReportLocationAggregate[]> {
    const whereConditions = [
      sql`${anonymousIncidentReports.location} ->> 'region' = 'Eastern Africa'`,
    ];

    if (filters.country) {
      whereConditions.push(
        sql`LOWER(${anonymousIncidentReports.location} ->> 'country') = LOWER(${filters.country})`,
      );
    }

    if (filters.category) {
      whereConditions.push(eq(incidentTypes.name, filters.category));
    }

    if (filters.search) {
      const searchValue = filters.search.toLowerCase();
      whereConditions.push(
        sql`(
          LOWER(${anonymousIncidentReports.location} ->> 'admin1') LIKE ${`%${searchValue}%`} OR
          LOWER(${anonymousIncidentReports.location} ->> 'country') LIKE ${`%${searchValue}%`} OR
          LOWER(${anonymousIncidentReports.location} ->> 'display_name') LIKE ${`%${searchValue}%`} OR
          LOWER(${incidentTypes.name}) LIKE ${`%${searchValue}%`} OR
          LOWER(${anonymousIncidentReports.description}) LIKE ${`%${searchValue}%`}
        )`,
      );
    }

    return this.database
      .select({
        region: sql`${anonymousIncidentReports.location} ->> 'region'`,
        country: sql`${anonymousIncidentReports.location} ->> 'country'`,
        totalFatalities: sum(anonymousIncidentReports.fatalities),
        totalInjuries: sum(anonymousIncidentReports.injuries),
        totalReports: count(anonymousIncidentReports.id),
        lat: sql`CAST(${anonymousIncidentReports.location} ->> 'lat' AS DOUBLE PRECISION)`,
        lon: sql`CAST(${anonymousIncidentReports.location} ->> 'lon' AS DOUBLE PRECISION)`,
        displayName: sql`${anonymousIncidentReports.location} ->> 'admin1'`,
        incidentTypes: sql`string_agg(DISTINCT ${incidentTypes.name}, ', ')`,
        incidentTypeColor: sql`MAX(${incidentTypes.color})`,
      })
      .from(anonymousIncidentReports)
      .leftJoin(
        incidentTypes,
        eq(anonymousIncidentReports.incidentTypeId, incidentTypes.id),
      )
      .where(and(...whereConditions))
      .groupBy(
        sql`${anonymousIncidentReports.location} ->> 'region'`,
        sql`${anonymousIncidentReports.location} ->> 'country'`,
        sql`${anonymousIncidentReports.location} ->> 'lat'`,
        sql`${anonymousIncidentReports.location} ->> 'lon'`,
        sql`${anonymousIncidentReports.location} ->> 'admin1'`,
      ) as Promise<AnonymousReportLocationAggregate[]>;
  }

  async getAfricawideHeatmapData(): Promise<AfricawideHeatmapPoint[]> {
    return this.database
      .select({
        region: sql`${anonymousIncidentReports.location} ->> 'region'`,
        country: sql`${anonymousIncidentReports.location} ->> 'country'`,
        lat: sql`CAST(${anonymousIncidentReports.location} ->> 'lat' AS DOUBLE PRECISION)`,
        lon: sql`CAST(${anonymousIncidentReports.location} ->> 'lon' AS DOUBLE PRECISION)`,
        displayName: sql`${anonymousIncidentReports.location} ->> 'admin1'`,
        incidentType: incidentTypes.name,
        totalFatalities: sum(anonymousIncidentReports.fatalities),
        totalInjuries: sum(anonymousIncidentReports.injuries),
        incidentCount: count(anonymousIncidentReports.id),
      })
      .from(anonymousIncidentReports)
      .leftJoin(
        incidentTypes,
        eq(anonymousIncidentReports.incidentTypeId, incidentTypes.id),
      )
      .where(sql`${anonymousIncidentReports.location} ->> 'region' LIKE '%Africa%'`)
      .groupBy(
        sql`${anonymousIncidentReports.location} ->> 'region'`,
        sql`${anonymousIncidentReports.location} ->> 'country'`,
        sql`${anonymousIncidentReports.location} ->> 'lat'`,
        sql`${anonymousIncidentReports.location} ->> 'lon'`,
        sql`${anonymousIncidentReports.location} ->> 'admin1'`,
        incidentTypes.name,
      ) as Promise<AfricawideHeatmapPoint[]>;
  }

  async getCombinedIncidentReports(
    filters: CombinedIncidentReportFilters,
  ): Promise<CombinedIncidentReportAggregate[]> {
    const results: CombinedIncidentReportAggregate[] = [];
    const allowedCountries = [
      "Kenya",
      "Uganda",
      "Tanzania",
      "Rwanda",
      "Ethiopia",
      "Djibouti",
      "Eritrea",
      "Pakistan",
    ];

    const anonymousConditions = [
      sql`LOWER(${anonymousIncidentReports.location} ->> 'country') IN (${sql.raw(
        allowedCountries.map((c) => `'${c.toLowerCase()}'`).join(","),
      )})`,
    ];

    if (filters.country) {
      anonymousConditions.push(
        sql`LOWER(${anonymousIncidentReports.location} ->> 'country') = LOWER(${filters.country})`,
      );
    }

    if (filters.category) {
      anonymousConditions.push(
        sql`LOWER(${incidentTypes.name}) = LOWER(${filters.category})`,
      );
    }

    if (filters.timeframe) {
      const dateCondition =
        filters.timeframe === "week"
          ? sql`${anonymousIncidentReports.createdAt} >= NOW() - INTERVAL '7 days'`
          : filters.timeframe === "month"
            ? sql`${anonymousIncidentReports.createdAt} >= NOW() - INTERVAL '1 month'`
            : sql`${anonymousIncidentReports.createdAt} >= NOW() - INTERVAL '1 year'`;
      anonymousConditions.push(dateCondition);
    }

    if (filters.search) {
      const searchValue = filters.search.toLowerCase();
      anonymousConditions.push(
        sql`(
          LOWER(${anonymousIncidentReports.location} ->> 'admin1') LIKE ${`%${searchValue}%`} OR
          LOWER(${anonymousIncidentReports.location} ->> 'country') LIKE ${`%${searchValue}%`} OR
          LOWER(${anonymousIncidentReports.location} ->> 'display_name') LIKE ${`%${searchValue}%`} OR
          LOWER(${incidentTypes.name}) LIKE ${`%${searchValue}%`} OR
          LOWER(${anonymousIncidentReports.description}) LIKE ${`%${searchValue}%`}
        )`,
      );
    }

    const anonymousReports = await this.database
      .select({
        region: sql`${anonymousIncidentReports.location} ->> 'region'`,
        country: sql`${anonymousIncidentReports.location} ->> 'country'`,
        totalFatalities: sum(anonymousIncidentReports.fatalities),
        totalInjuries: sum(anonymousIncidentReports.injuries),
        totalReports: count(anonymousIncidentReports.id),
        lat: sql`CAST(${anonymousIncidentReports.location} ->> 'lat' AS DOUBLE PRECISION)`,
        lon: sql`CAST(${anonymousIncidentReports.location} ->> 'lon' AS DOUBLE PRECISION)`,
        displayName: sql`COALESCE(NULLIF(${anonymousIncidentReports.location} ->> 'admin1', ''), ${anonymousIncidentReports.location} ->> 'country')`,
        incidentTypes: sql`string_agg(DISTINCT ${incidentTypes.name}, ', ')`,
        incidentTypeDescriptions: sql`string_agg(DISTINCT ${incidentTypes.description}, ' | ')`,
        incidentTypeColor: sql`MAX(${incidentTypes.color})`,
        source: sql`'anonymous'`,
      })
      .from(anonymousIncidentReports)
      .leftJoin(
        incidentTypes,
        eq(anonymousIncidentReports.incidentTypeId, incidentTypes.id),
      )
      .where(and(...anonymousConditions))
      .groupBy(
        sql`${anonymousIncidentReports.location} ->> 'region'`,
        sql`${anonymousIncidentReports.location} ->> 'country'`,
        sql`${anonymousIncidentReports.location} ->> 'lat'`,
        sql`${anonymousIncidentReports.location} ->> 'lon'`,
        sql`COALESCE(NULLIF(${anonymousIncidentReports.location} ->> 'admin1', ''), ${anonymousIncidentReports.location} ->> 'country')`,
      );

    results.push(...(anonymousReports as CombinedIncidentReportAggregate[]));

    const organizationConditions = [
      sql`LOWER(${organizationIncidentReports.location} ->> 'country') IN (${sql.raw(
        allowedCountries.map((c) => `'${c.toLowerCase()}'`).join(","),
      )})`,
    ];

    if (filters.country) {
      organizationConditions.push(
        sql`LOWER(${organizationIncidentReports.location} ->> 'country') = LOWER(${filters.country})`,
      );
    }

    if (filters.category) {
      organizationConditions.push(
        sql`LOWER(${incidentTypes.name}) = LOWER(${filters.category})`,
      );
    }

    if (filters.timeframe) {
      const dateCondition =
        filters.timeframe === "week"
          ? sql`${organizationIncidentReports.createdAt} >= NOW() - INTERVAL '7 days'`
          : filters.timeframe === "month"
            ? sql`${organizationIncidentReports.createdAt} >= NOW() - INTERVAL '1 month'`
            : sql`${organizationIncidentReports.createdAt} >= NOW() - INTERVAL '1 year'`;
      organizationConditions.push(dateCondition);
    }

    if (filters.search) {
      const searchValue = filters.search.toLowerCase();
      organizationConditions.push(
        sql`(
          LOWER(${organizationIncidentReports.location} ->> 'admin1') LIKE ${`%${searchValue}%`} OR
          LOWER(${organizationIncidentReports.location} ->> 'country') LIKE ${`%${searchValue}%`} OR
          LOWER(${organizationIncidentReports.location} ->> 'display_name') LIKE ${`%${searchValue}%`} OR
          LOWER(${incidentTypes.name}) LIKE ${`%${searchValue}%`} OR
          LOWER(${organizationIncidentReports.description}) LIKE ${`%${searchValue}%`}
        )`,
      );
    }

    const orgReports = await this.database
      .select({
        region: sql`${organizationIncidentReports.location} ->> 'region'`,
        country: sql`${organizationIncidentReports.location} ->> 'country'`,
        totalFatalities: sum(organizationIncidentReports.fatalities),
        totalInjuries: sum(organizationIncidentReports.injuries),
        totalReports: count(organizationIncidentReports.id),
        lat: sql`CAST(${organizationIncidentReports.location} ->> 'lat' AS DOUBLE PRECISION)`,
        lon: sql`CAST(${organizationIncidentReports.location} ->> 'lon' AS DOUBLE PRECISION)`,
        displayName: sql`COALESCE(NULLIF(${organizationIncidentReports.location} ->> 'admin1', ''), ${organizationIncidentReports.location} ->> 'country')`,
        incidentTypes: sql`string_agg(DISTINCT ${incidentTypes.name}, ', ')`,
        incidentTypeDescriptions: sql`string_agg(DISTINCT ${incidentTypes.description}, ' | ')`,
        incidentTypeColor: sql`MAX(${incidentTypes.color})`,
        source: sql`'organization'`,
      })
      .from(organizationIncidentReports)
      .leftJoin(
        incidentTypes,
        eq(organizationIncidentReports.incidentTypeId, incidentTypes.id),
      )
      .where(and(...organizationConditions))
      .groupBy(
        sql`${organizationIncidentReports.location} ->> 'region'`,
        sql`${organizationIncidentReports.location} ->> 'country'`,
        sql`${organizationIncidentReports.location} ->> 'lat'`,
        sql`${organizationIncidentReports.location} ->> 'lon'`,
        sql`COALESCE(NULLIF(${organizationIncidentReports.location} ->> 'admin1', ''), ${organizationIncidentReports.location} ->> 'country')`,
      );

    results.push(...(orgReports as CombinedIncidentReportAggregate[]));

    return results;
  }
}
