import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router } from "../trpc";
import { organizationProcedure } from "../middleware";
import { organizationIncidentFormSchema } from "@/features/organization-reporting/schemas/organization-incident-form-schema";
import { db } from "@/db";
import { organizationIncidentReports } from "@/db/schemas/organization-incident-reports";
import { incidentTypes } from "@/db/schemas/incident-types";
import { organizationIncidentTypes } from "@/db/schemas/organization-incident-types";
import { eq, and, desc, count, sql, sum } from "drizzle-orm";

export const organizationReportingRouter = router({
  // Submit organization incident report
  submitOrganizationIncidentReport: organizationProcedure
    .input(organizationIncidentFormSchema)
    .mutation(async ({ input, ctx }) => {
      const userWithOrg = ctx.user as typeof ctx.user & {
        organizationId?: string;
      };

      if (!userWithOrg.organizationId) {
        throw new Error("User must be associated with an organization");
      }

      try {
        console.log("Submitting organization incident report:", input);

        // Convert casualty counts from strings to integers
        const injuriesCount =
          input.injuries === "6+" ? 6 : parseInt(input.injuries);
        const fatalitiesCount =
          input.fatalities === "6+" ? 6 : parseInt(input.fatalities);

        // Verify that the incident type is enabled for this organization
        const enabledType = await db
          .select()
          .from(organizationIncidentTypes)
          .where(
            and(
              eq(
                organizationIncidentTypes.organizationId,
                userWithOrg.organizationId
              ),
              eq(organizationIncidentTypes.incidentTypeId, input.category),
              eq(organizationIncidentTypes.isEnabled, true)
            )
          )
          .limit(1);

        if (enabledType.length === 0) {
          throw new Error(
            "Selected incident type is not enabled for your organization"
          );
        }

        await db.insert(organizationIncidentReports).values({
          organizationId: userWithOrg.organizationId,
          reportedByUserId: ctx.user.id,
          incidentTypeId: input.category,
          location: input.location,
          description: input.description,
          entities: input.entities,
          injuries: injuriesCount,
          fatalities: fatalitiesCount,
          severity: input.severity,
        });

        console.log("Organization incident report submitted successfully");
        return {
          success: true,
          message: "Incident report submitted successfully",
        };
      } catch (error) {
        console.error("Failed to submit organization incident report:", error);
        throw new Error(
          error instanceof Error
            ? error.message
            : "Failed to submit incident report"
        );
      }
    }),

  // Get organization incident reports with filtering
  getOrganizationIncidentReports: organizationProcedure
    .input(
      z.object({
        country: z.string().optional(),
        category: z.string().optional(),
        severity: z.enum(["low", "medium", "high", "critical"]).optional(),
        verified: z.boolean().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const userWithOrg = ctx.user as typeof ctx.user & {
        organizationId?: string;
      };

      if (!userWithOrg.organizationId) {
        throw new Error("User must be associated with an organization");
      }

      try {
        console.log("Getting organization reports with filters:", input);

        // Build dynamic where conditions
        const whereConditions = [
          eq(
            organizationIncidentReports.organizationId,
            userWithOrg.organizationId
          ),
        ];

        // Add country filter if provided
        if (input.country) {
          whereConditions.push(
            sql`LOWER(${organizationIncidentReports.location} ->> 'country') = LOWER(${input.country})`
          );
        }

        // Add category filter if provided
        if (input.category) {
          whereConditions.push(eq(incidentTypes.name, input.category));
        }

        // Add severity filter if provided
        if (input.severity) {
          whereConditions.push(
            eq(organizationIncidentReports.severity, input.severity)
          );
        }

        // Add verified filter if provided
        if (input.verified !== undefined) {
          whereConditions.push(
            eq(organizationIncidentReports.verified, input.verified)
          );
        }

        // Add search filter if provided
        if (input.search) {
          const searchValue = input.search.toLowerCase();
          whereConditions.push(
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
            )`
          );
        }

        // Aggregate reports by location
        const response = await db
          .select({
            region: sql`${organizationIncidentReports.location} ->> 'region'`,
            country: sql`${organizationIncidentReports.location} ->> 'country'`,
            totalFatalities: sum(organizationIncidentReports.fatalities),
            totalInjuries: sum(organizationIncidentReports.injuries),
            totalReports: count(organizationIncidentReports.id),
            lat: sql`CAST(${organizationIncidentReports.location} ->> 'lat' AS DOUBLE PRECISION)`,
            lon: sql`CAST(${organizationIncidentReports.location} ->> 'lon' AS DOUBLE PRECISION)`,
            displayName: sql`${organizationIncidentReports.location} ->> 'admin1'`,
            incidentTypes: sql`string_agg(DISTINCT ${incidentTypes.name}, ', ')`,
            incidentTypeColor: sql`MAX(${incidentTypes.color})`,
            severity: sql`MAX(${organizationIncidentReports.severity})`,
            verified: sql`BOOL_OR(${organizationIncidentReports.verified})`,
            source: sql`'organization'`, // Mark as organization source
          })
          .from(organizationIncidentReports)
          .leftJoin(
            incidentTypes,
            eq(organizationIncidentReports.incidentTypeId, incidentTypes.id)
          )
          .where(and(...whereConditions))
          .groupBy(
            sql`${organizationIncidentReports.location} ->> 'region'`,
            sql`${organizationIncidentReports.location} ->> 'country'`,
            sql`${organizationIncidentReports.location} ->> 'lat'`,
            sql`${organizationIncidentReports.location} ->> 'lon'`,
            sql`${organizationIncidentReports.location} ->> 'admin1'`
          )
          .limit(input.limit)
          .offset(input.offset)
          .orderBy(desc(sql`count(${organizationIncidentReports.id})`));

        return {
          success: true,
          message: "Successfully fetched organization incident reports",
          data: response,
        };
      } catch (error) {
        console.error("Failed to fetch organization incident reports:", error);
        return {
          success: false,
          message: "Failed to fetch organization incident reports",
          data: [],
        };
      }
    }),

  // Get user's organization incident reports for dashboard
  getUserOrganizationIncidentReports: organizationProcedure
    .input(
      z.object({
        status: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const userWithOrg = ctx.user as typeof ctx.user & {
        organizationId?: string;
      };

      if (!userWithOrg.organizationId) {
        throw new Error("User must be associated with an organization");
      }

      try {
        console.log("Getting user's organization incident reports:", input);

        // Build dynamic where conditions
        const whereConditions = [
          eq(organizationIncidentReports.reportedByUserId, ctx.user.id),
          eq(
            organizationIncidentReports.organizationId,
            userWithOrg.organizationId
          ),
        ];

        // Add search filter if provided
        if (input.search) {
          const searchValue = input.search.toLowerCase();
          whereConditions.push(
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
            )`
          );
        }

        // Get individual reports
        const reports = await db
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
            eq(organizationIncidentReports.incidentTypeId, incidentTypes.id)
          )
          .where(and(...whereConditions))
          .orderBy(desc(organizationIncidentReports.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        return {
          success: true,
          message: "Successfully fetched user's organization incident reports",
          reports,
        };
      } catch (error) {
        console.error(
          "Failed to fetch user's organization incident reports:",
          error
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch incident reports",
        });
      }
    }),

  // Get organization's incident statistics
  getOrganizationIncidentStats: organizationProcedure.query(async ({ ctx }) => {
    const userWithOrg = ctx.user as typeof ctx.user & {
      organizationId?: string;
    };

    if (!userWithOrg.organizationId) {
      throw new Error("User must be associated with an organization");
    }

    try {
      const stats = await db
        .select({
          totalReports: count(organizationIncidentReports.id),
          totalFatalities: sum(organizationIncidentReports.fatalities),
          totalInjuries: sum(organizationIncidentReports.injuries),
          verifiedReports: sql`COUNT(CASE WHEN ${organizationIncidentReports.verified} = true THEN 1 END)`,
          unverifiedReports: sql`COUNT(CASE WHEN ${organizationIncidentReports.verified} = false THEN 1 END)`,
          criticalReports: sql`COUNT(CASE WHEN ${organizationIncidentReports.severity} = 'critical' THEN 1 END)`,
          highSeverityReports: sql`COUNT(CASE WHEN ${organizationIncidentReports.severity} = 'high' THEN 1 END)`,
        })
        .from(organizationIncidentReports)
        .where(
          eq(
            organizationIncidentReports.organizationId,
            userWithOrg.organizationId
          )
        );

      return {
        success: true,
        data: stats[0] || {
          totalReports: 0,
          totalFatalities: 0,
          totalInjuries: 0,
          verifiedReports: 0,
          unverifiedReports: 0,
          criticalReports: 0,
          highSeverityReports: 0,
        },
      };
    } catch (error) {
      console.error("Failed to fetch organization incident stats:", error);
      return {
        success: false,
        message: "Failed to fetch incident statistics",
        data: null,
      };
    }
  }),
});
