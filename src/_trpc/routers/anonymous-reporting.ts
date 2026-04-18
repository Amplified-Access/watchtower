import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { db } from "@/db";
import { incidentTypes } from "@/db/schemas/incident-types";
import { organizationIncidentTypes } from "@/db/schemas/organization-incident-types";
import { organizationIncidentReports } from "@/db/schemas/organization-incident-reports";
import { formSchema } from "@/features/anonymous-reporting/schemas/anonymous-incident-reproting-form-schema";
import { anonymousIncidentReports } from "@/db/schemas/anonymous-incident-reports";
import { and, count, eq, sql, sum } from "drizzle-orm";

export const anonymousReportingRouter = router({
  getAllIncidentTypes: publicProcedure.query(async () => {
    console.log("Fetching active incident types:");
    try {
      // Return all active incident types
      const response = await db
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

      return {
        success: true,
        message: "Successfully retrieved incident types",
        data: response,
      };
    } catch (error) {
      console.error("Failed to fetch incident types: ", error);
      return {
        success: false,
        message: "Failed to fetch incident types.",
        data: [],
      };
    } finally {
      console.log("Finished fetching incident types:");
    }
  }),

  getActiveIncidentTypesForMaps: publicProcedure.query(async () => {
    console.log("Fetching incident types with multiple reports for maps:");
    try {
      // Get incident types that are:
      // 1. Active
      // 2. Have more than one incident report (anonymous OR organization)
      const response = await db
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

      return {
        success: true,
        message: "Successfully retrieved incident types with reports",
        data: response,
      };
    } catch (error) {
      console.error("Failed to fetch incident types with reports: ", error);
      return {
        success: false,
        message: "Failed to fetch incident types with multiple reports.",
        data: [],
      };
    } finally {
      console.log(
        "Finished fetching incident types with multiple reports for maps:",
      );
    }
  }),

  searchLocation: publicProcedure
    .input(
      z.object({
        searchTerm: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const apiKey = process.env.LOCATION_IQ_API_KEY;
      const { searchTerm } = input;
      const preparedSearchTerm = encodeURIComponent(searchTerm);
      try {
        console.log("Fetching places:");
        const response = await fetch(
          `https://us1.locationiq.com/v1/search?key=${apiKey}&q=${preparedSearchTerm}&format=json`,
        ).then(async (res) => await res.json());

        if (!response) {
          console.error("Could not get place for search term");
          throw new Error("Could not get place for search term");
        }

        console.log("response: ", response);

        return {
          success: true,
          message: "Successfully found places",
          data: response,
        };
      } catch (error) {
        console.error("Failed to fetch places: ", error);
        return {
          success: false,
          message: "Failed to fetch places.",
          data: [],
        };
      } finally {
        console.log("Finished fetching places:");
      }
    }),

  submitAmonymousIncidentReport: publicProcedure
    .input(formSchema)
    .mutation(async (opts) => {
      const { input } = opts;
      console.log("Received incident report:", input);
      try {
        console.log("Submitting incident...");

        // Convert casualty counts from strings to integers
        const injuriesCount =
          input.injuries === "6+" ? 6 : parseInt(input.injuries);
        const fatalitiesCount =
          input.fatalities === "6+" ? 6 : parseInt(input.fatalities);

        await db.insert(anonymousIncidentReports).values({
          incidentTypeId: input.category,
          location: input.location,
          description: input.description,
          injuries: injuriesCount,
          fatalities: fatalitiesCount,
          entities: input.entities,
          evidenceFileKey: input.evidenceFileKey || null,
          audioFileKey: input.audioFileKey || null,
        });

        console.log("Incident report submitted successfully");
        return {
          success: true,
          message: "Incident report submitted successfully",
        };
      } catch (error) {
        console.error("Failed to submit incident report:", error);
        throw new Error("Failed to submit incident report");
      } finally {
        console.log("Finished submission of incident");
      }
    }),

  getAllAnonymousIncidentReports: publicProcedure
    .input(
      z.object({
        country: z.string().optional(),
        category: z.string().optional(),
        sources: z.array(z.string()).optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      try {
        console.log("Getting anonymous reports with filters:", input);

        // Build dynamic where conditions
        const whereConditions = [
          sql`${anonymousIncidentReports.location} ->> 'region' = 'Eastern Africa'`, // Keep region filter
        ];

        // Add country filter if provided
        if (input.country) {
          whereConditions.push(
            sql`LOWER(${anonymousIncidentReports.location} ->> 'country') = LOWER(${input.country})`,
          );
        }

        // Add category filter if provided
        if (input.category) {
          whereConditions.push(eq(incidentTypes.name, input.category));
        }

        // Add search filter if provided
        if (input.search) {
          const searchValue = input.search.toLowerCase();
          whereConditions.push(
            sql`(
              LOWER(${
                anonymousIncidentReports.location
              } ->> 'admin1') LIKE ${`%${searchValue}%`} OR 
              LOWER(${
                anonymousIncidentReports.location
              } ->> 'country') LIKE ${`%${searchValue}%`} OR 
              LOWER(${
                anonymousIncidentReports.location
              } ->> 'display_name') LIKE ${`%${searchValue}%`} OR 
              LOWER(${incidentTypes.name}) LIKE ${`%${searchValue}%`} OR
              LOWER(${
                anonymousIncidentReports.description
              }) LIKE ${`%${searchValue}%`}
            )`,
          );
        }

        // First, let's get a simple aggregation by location without the complex JSON aggregation
        const response = await db
          .select({
            region: sql`${anonymousIncidentReports.location} ->> 'region'`,
            country: sql`${anonymousIncidentReports.location} ->> 'country'`,
            totalFatalities: sum(anonymousIncidentReports.fatalities),
            totalInjuries: sum(anonymousIncidentReports.injuries),
            totalReports: count(anonymousIncidentReports.id),
            lat: sql`CAST(${anonymousIncidentReports.location} ->> 'lat' AS DOUBLE PRECISION)`,
            lon: sql`CAST(${anonymousIncidentReports.location} ->> 'lon' AS DOUBLE PRECISION)`,
            displayName: sql`${anonymousIncidentReports.location} ->> 'admin1'`,
            // Get a simple comma-separated list of incident types for now
            incidentTypes: sql`string_agg(DISTINCT ${incidentTypes.name}, ', ')`,
            // Include the first incident type color (when filtering by category, there will be only one)
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
          );

        return {
          success: true,
          message: "Successfully fetched anonymous incident reports",
          data: response,
        };
      } catch (error) {
        console.error("Failed to fetch anonymous incident reports : ", error);
        return {
          success: false,
          message: "Failed to fetch anonymous incident reports",
          data: [],
        };
      } finally {
        console.log("Finished getting anonymous reports");
      }
    }),

  getAfricawideHeatmapData: publicProcedure.query(async () => {
    try {
      console.log("Getting africawide heatmap data");

      // Get all data for African countries without any filters
      // This aggregates incidents by location and incident type
      const response = await db
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
        .where(
          sql`${anonymousIncidentReports.location} ->> 'region' LIKE '%Africa%'`,
        )
        .groupBy(
          sql`${anonymousIncidentReports.location} ->> 'region'`,
          sql`${anonymousIncidentReports.location} ->> 'country'`,
          sql`${anonymousIncidentReports.location} ->> 'lat'`,
          sql`${anonymousIncidentReports.location} ->> 'lon'`,
          sql`${anonymousIncidentReports.location} ->> 'admin1'`,
          incidentTypes.name,
        );

      return {
        success: true,
        message: "Successfully fetched africawide heatmap data",
        data: response,
      };
    } catch (error) {
      console.error("Failed to fetch africawide heatmap data: ", error);
      return {
        success: false,
        message: "Failed to fetch africawide heatmap data",
        data: [],
      };
    } finally {
      console.log("Finished getting africawide heatmap data");
    }
  }),

  // Get combined incident reports
  getCombinedIncidentReports: publicProcedure
    .input(
      z.object({
        country: z.string().optional(),
        category: z.string().optional(),
        search: z.string().optional(),
        timeframe: z.enum(["week", "month", "year"]).optional(),
      }),
    )
    .query(async ({ input }) => {
      try {
        console.log("🔍 Getting combined reports with filters:", input);

        const results = [];

        // Define countries for filtering (East Africa + Pakistan)
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

        // Get anonymous reports
        {
          const anonymousConditions = [
            // Filter to only allowed countries
            sql`LOWER(${
              anonymousIncidentReports.location
            } ->> 'country') IN (${sql.raw(
              allowedCountries.map((c) => `'${c.toLowerCase()}'`).join(","),
            )})`,
          ];

          if (input.country) {
            anonymousConditions.push(
              sql`LOWER(${anonymousIncidentReports.location} ->> 'country') = LOWER(${input.country})`,
            );
          }

          if (input.category) {
            // Use case-insensitive matching for incident type names
            anonymousConditions.push(
              sql`LOWER(${incidentTypes.name}) = LOWER(${input.category})`,
            );
          }

          if (input.timeframe) {
            const dateCondition =
              input.timeframe === "week"
                ? sql`${anonymousIncidentReports.createdAt} >= NOW() - INTERVAL '7 days'`
                : input.timeframe === "month"
                  ? sql`${anonymousIncidentReports.createdAt} >= NOW() - INTERVAL '1 month'`
                  : sql`${anonymousIncidentReports.createdAt} >= NOW() - INTERVAL '1 year'`;
            anonymousConditions.push(dateCondition);
          }

          if (input.search) {
            const searchValue = input.search.toLowerCase();
            anonymousConditions.push(
              sql`(
                LOWER(${
                  anonymousIncidentReports.location
                } ->> 'admin1') LIKE ${`%${searchValue}%`} OR 
                LOWER(${
                  anonymousIncidentReports.location
                } ->> 'country') LIKE ${`%${searchValue}%`} OR 
                LOWER(${
                  anonymousIncidentReports.location
                } ->> 'display_name') LIKE ${`%${searchValue}%`} OR 
                LOWER(${incidentTypes.name}) LIKE ${`%${searchValue}%`} OR
                LOWER(${
                  anonymousIncidentReports.description
                }) LIKE ${`%${searchValue}%`}
              )`,
            );
          }

          const anonymousReports = await db
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

          console.log(
            `📊 Anonymous reports found: ${anonymousReports.length}`,
            anonymousReports,
          );
          results.push(...anonymousReports);
        }

        // Get organization reports
        {
          const organizationConditions = [
            // Filter to only allowed countries using the country field
            sql`LOWER(${
              organizationIncidentReports.location
            } ->> 'country') IN (${sql.raw(
              allowedCountries.map((c) => `'${c.toLowerCase()}'`).join(","),
            )})`,
          ];

          if (input.country) {
            organizationConditions.push(
              sql`LOWER(${organizationIncidentReports.location} ->> 'country') = LOWER(${input.country})`,
            );
          }

          if (input.category) {
            // Use case-insensitive matching for incident type names
            organizationConditions.push(
              sql`LOWER(${incidentTypes.name}) = LOWER(${input.category})`,
            );
          }

          if (input.timeframe) {
            const dateCondition =
              input.timeframe === "week"
                ? sql`${organizationIncidentReports.createdAt} >= NOW() - INTERVAL '7 days'`
                : input.timeframe === "month"
                  ? sql`${organizationIncidentReports.createdAt} >= NOW() - INTERVAL '1 month'`
                  : sql`${organizationIncidentReports.createdAt} >= NOW() - INTERVAL '1 year'`;
            organizationConditions.push(dateCondition);
          }

          if (input.search) {
            const searchValue = input.search.toLowerCase();
            organizationConditions.push(
              sql`(
                LOWER(${
                  organizationIncidentReports.location
                } ->> 'admin1') LIKE ${`%${searchValue}%`} OR 
                LOWER(${
                  organizationIncidentReports.location
                } ->> 'country') LIKE ${`%${searchValue}%`} OR 
                LOWER(${
                  organizationIncidentReports.location
                } ->> 'display_name') LIKE ${`%${searchValue}%`} OR 
                LOWER(${incidentTypes.name}) LIKE ${`%${searchValue}%`} OR
                LOWER(${
                  organizationIncidentReports.description
                }) LIKE ${`%${searchValue}%`}
              )`,
            );
          }

          const orgReports = await db
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

          console.log(
            `📊 Organization reports found: ${orgReports.length}`,
            orgReports,
          );
          results.push(...orgReports);
        }

        console.log(`✅ Total combined reports: ${results.length}`);
        return {
          success: true,
          message: "Successfully fetched combined incident reports",
          data: results,
        };
      } catch (error) {
        console.error("Failed to fetch combined incident reports:", error);
        return {
          success: false,
          message: "Failed to fetch combined incident reports",
          data: [],
        };
      }
    }),
});
