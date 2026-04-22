import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router } from "../trpc";
import { organizationProcedure } from "../middleware";
import { incidentsApi } from "@/lib/api/incidents";

export const organizationReportingRouter = router({
  submitOrganizationIncidentReport: organizationProcedure
    .input(
      z.object({
        category: z.string(),
        location: z.object({
          latitude: z.number(),
          longitude: z.number(),
          address: z.string().optional(),
          country: z.string().optional(),
          name: z.string().optional(),
        }),
        description: z.string(),
        entities: z.array(z.string()).optional(),
        injuries: z.number().optional(),
        fatalities: z.number().optional(),
        severity: z.enum(["low", "medium", "high", "critical"]).optional(),
        evidenceFileKey: z.string().optional(),
        audioFileKey: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const res = await incidentsApi.submitOrgReport({
          incidentTypeId: input.category,
          location: input.location,
          description: input.description,
          entities: input.entities,
          injuries: input.injuries,
          fatalities: input.fatalities,
          severity: input.severity,
          evidenceFileKey: input.evidenceFileKey,
          audioFileKey: input.audioFileKey,
        });
        if (!res.success) throw new Error(res.error ?? "Failed to submit report");
        return { success: true, data: res.data };
      } catch (error) {
        console.error("Failed to submit organization incident report:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit incident report",
        });
      }
    }),

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
      try {
        const orgId = (ctx as { organizationId?: string }).organizationId;
        if (!orgId) throw new Error("No organization ID");
        const res = await incidentsApi.getOrgReports(orgId, {
          limit: input.limit,
          offset: input.offset,
          search: input.search,
        });
        if (!res.success) throw new Error(res.error ?? "Failed to fetch reports");
        return { success: true, data: res.data?.data, total: res.data?.total };
      } catch (error) {
        console.error("Failed to fetch organization incident reports:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch incident reports",
        });
      }
    }),

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
      try {
        const orgId = (ctx as { organizationId?: string }).organizationId;
        if (!orgId) throw new Error("No organization ID");
        const res = await incidentsApi.getOrgReports(orgId, {
          limit: input.limit,
          offset: input.offset,
          search: input.search,
        });
        if (!res.success) throw new Error(res.error ?? "Failed to fetch reports");
        return { success: true, data: res.data?.data, total: res.data?.total };
      } catch (error) {
        console.error("Failed to fetch user organization incident reports:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch incident reports",
        });
      }
    }),

  getOrganizationIncidentStats: organizationProcedure.query(async ({ ctx }) => {
    try {
      const orgId = (ctx as { organizationId?: string }).organizationId;
      if (!orgId) throw new Error("No organization ID");
      const res = await incidentsApi.getOrgReportStats(orgId);
      if (!res.success) throw new Error(res.error ?? "Failed to fetch stats");
      return { success: true, data: res.data };
    } catch (error) {
      console.error("Failed to fetch organization incident stats:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch incident statistics",
      });
    }
  }),
});
