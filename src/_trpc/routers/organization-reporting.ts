import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router } from "../trpc";
import { organizationProcedure } from "../middleware";
import { organizationIncidentFormSchema } from "@/features/organization-reporting/schemas/organization-incident-form-schema";
import { createOrganizationReportingUseCases } from "@/features/organization-reporting";

const organizationReporting = createOrganizationReportingUseCases();

export const organizationReportingRouter = router({
  // Submit organization incident report
  submitOrganizationIncidentReport: organizationProcedure
    .input(organizationIncidentFormSchema)
    .mutation(async ({ input, ctx }) => {
      const userWithOrg = ctx.user as typeof ctx.user & {
        organizationId?: string;
      };

      try {
        console.log("Submitting organization incident report:", input);

        const result =
          await organizationReporting.submitOrganizationIncidentReport.execute({
            organizationId: userWithOrg.organizationId,
            reportedByUserId: ctx.user.id,
            category: input.category,
            location: input.location,
            description: input.description,
            entities: input.entities,
            injuries: input.injuries,
            fatalities: input.fatalities,
            severity: input.severity,
          });

        console.log("Organization incident report submitted successfully");
        return result;
      } catch (error) {
        console.error("Failed to submit organization incident report:", error);
        throw new Error(
          error instanceof Error
            ? error.message
            : "Failed to submit incident report",
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
      }),
    )
    .query(async ({ input, ctx }) => {
      const userWithOrg = ctx.user as typeof ctx.user & {
        organizationId?: string;
      };

      try {
        console.log("Getting organization reports with filters:", input);

        return await organizationReporting.getOrganizationIncidentReports.execute(
          {
            organizationId: userWithOrg.organizationId,
            filters: input,
          },
        );
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
      }),
    )
    .query(async ({ input, ctx }) => {
      const userWithOrg = ctx.user as typeof ctx.user & {
        organizationId?: string;
      };

      try {
        console.log("Getting user's organization incident reports:", input);

        return await organizationReporting.getUserOrganizationIncidentReports.execute(
          {
            organizationId: userWithOrg.organizationId,
            userId: ctx.user.id,
            filters: input,
          },
        );
      } catch (error) {
        console.error(
          "Failed to fetch user's organization incident reports:",
          error,
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

    try {
      return await organizationReporting.getOrganizationIncidentStats.execute({
        organizationId: userWithOrg.organizationId,
      });
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
