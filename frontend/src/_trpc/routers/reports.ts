import { TRPCError } from "@trpc/server";
import z from "zod";
import { organizationProcedure } from "../middleware";
import { publicProcedure, router } from "../trpc";
import { reportsApi } from "@/lib/api/reports";

export const reportsRouter = router({
  createReport: organizationProcedure
    .input(
      z.object({
        title: z.string().min(1, "Title is required"),
        fileKey: z.string().min(1, "File key is required"),
        status: z.enum(["draft", "published"]).default("draft"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const res = await reportsApi.createReport({
          title: input.title,
          fileKey: input.fileKey,
          status: input.status,
        });
        if (!res.success) throw new Error(res.error ?? "Failed to create report");
        return res.data;
      } catch (error) {
        console.error("Failed to create report:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create report",
        });
      }
    }),

  getOrganizationReports: organizationProcedure
    .input(
      z.object({
        organizationId: z.string(),
        status: z.enum(["draft", "published", "all"]).default("all"),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ input }) => {
      try {
        const status = input.status === "all" ? undefined : input.status;
        const res = await reportsApi.getOrganizationReports(input.organizationId, status);
        if (!res.success) throw new Error(res.error ?? "Failed to fetch reports");
        const reports = res.data ?? [];
        return {
          reports,
          totalCount: reports.length, // Go backend doesn't return total for this specific endpoint yet
        };
      } catch (error) {
        console.error("Failed to fetch organization reports:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch reports",
        });
      }
    }),

  getReportById: organizationProcedure
    .input(z.object({ reportId: z.string() }))
    .query(async ({ input }) => {
      try {
        const res = await reportsApi.getReportById(input.reportId);
        if (!res.success) {
          if (res.error?.includes("404")) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Report not found" });
          }
          throw new Error(res.error ?? "Failed to fetch report");
        }
        return res.data ?? null;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to fetch report:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch report",
        });
      }
    }),

  updateReport: organizationProcedure
    .input(
      z.object({
        reportId: z.string(),
        title: z.string().optional(),
        status: z.enum(["draft", "published"]).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const res = await reportsApi.updateReport(input.reportId, {
          title: input.title,
          status: input.status,
        });
        if (!res.success) throw new Error(res.error ?? "Failed to update report");
        return res.data;
      } catch (error) {
        console.error("Failed to update report:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update report",
        });
      }
    }),

  deleteReport: organizationProcedure
    .input(z.object({ reportId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const res = await reportsApi.deleteReport(input.reportId);
        if (!res.success) throw new Error(res.error ?? "Failed to delete report");
        return { success: true };
      } catch (error) {
        console.error("Failed to delete report:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete report",
        });
      }
    }),

  getPublicReports: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        search: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      try {
        const res = await reportsApi.getPublicReports({
          limit: input.limit,
          offset: input.offset,
          search: input.search,
        });
        if (!res.success) throw new Error(res.error ?? "Failed to fetch reports");
        return {
          data: res.data?.data ?? [],
          total: res.data?.total ?? 0,
        };
      } catch (error) {
        console.error("Failed to fetch public reports:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch reports",
        });
      }
    }),

  getPublicReportById: publicProcedure
    .input(z.object({ reportId: z.string() }))
    .query(async ({ input }) => {
      try {
        const res = await reportsApi.getPublicReportById(input.reportId);
        if (!res.success) {
          if (res.error?.includes("404")) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Report not found" });
          }
          throw new Error(res.error ?? "Failed to fetch report");
        }
        return res.data ?? null;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to fetch public report:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch report",
        });
      }
    }),
});
