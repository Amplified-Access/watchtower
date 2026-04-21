import { TRPCError } from "@trpc/server";
import z from "zod";
import { organizationProcedure } from "../middleware";
import { publicProcedure, router } from "../trpc";
import {
  createReportCatalogUseCases,
  ReportForbiddenError,
  ReportNotFoundError,
  ReportValidationError,
} from "@/features/reports";

const reportCatalog = createReportCatalogUseCases();

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
      const { title, fileKey, status } = input;
      try {
        return await reportCatalog.createReport.execute({
          title,
          fileKey,
          status,
          actor: {
            userId: ctx.user.id,
            role: ctx.user.role ?? "",
            organizationId: ctx.user.organizationId,
          },
        });
      } catch (error) {
        if (error instanceof ReportValidationError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        if (error instanceof TRPCError) throw error;
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
    .query(async ({ input, ctx }) => {
      const { organizationId, status, limit, offset } = input;
      try {
        return await reportCatalog.getOrganizationReports.execute({
          organizationId,
          status,
          limit,
          offset,
          actor: {
            userId: ctx.user.id,
            role: ctx.user.role ?? "",
            organizationId: ctx.user.organizationId,
          },
        });
      } catch (error) {
        if (error instanceof ReportForbiddenError) {
          throw new TRPCError({ code: "FORBIDDEN", message: error.message });
        }
        console.error("Failed to fetch reports:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch reports",
        });
      }
    }),

  getReportById: organizationProcedure
    .input(z.object({ reportId: z.string() }))
    .query(async ({ input, ctx }) => {
      const { reportId } = input;
      try {
        return await reportCatalog.getReportById.execute({
          reportId,
          actor: {
            userId: ctx.user.id,
            role: ctx.user.role ?? "",
            organizationId: ctx.user.organizationId,
          },
        });
      } catch (error) {
        if (error instanceof ReportNotFoundError) {
          throw new TRPCError({ code: "NOT_FOUND", message: error.message });
        }
        if (error instanceof ReportForbiddenError) {
          throw new TRPCError({ code: "FORBIDDEN", message: error.message });
        }
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
    .mutation(async ({ input, ctx }) => {
      const { reportId, title, status } = input;
      try {
        return await reportCatalog.updateReport.execute({
          reportId,
          title,
          status,
          actor: {
            userId: ctx.user.id,
            role: ctx.user.role ?? "",
            organizationId: ctx.user.organizationId,
          },
        });
      } catch (error) {
        if (error instanceof ReportNotFoundError) {
          throw new TRPCError({ code: "NOT_FOUND", message: error.message });
        }
        if (error instanceof ReportForbiddenError) {
          throw new TRPCError({ code: "FORBIDDEN", message: error.message });
        }
        if (error instanceof TRPCError) throw error;
        console.error("Failed to update report:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update report",
        });
      }
    }),

  deleteReport: organizationProcedure
    .input(z.object({ reportId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { reportId } = input;
      try {
        return await reportCatalog.deleteReport.execute({
          reportId,
          actor: {
            userId: ctx.user.id,
            role: ctx.user.role ?? "",
            organizationId: ctx.user.organizationId,
          },
        });
      } catch (error) {
        if (error instanceof ReportNotFoundError) {
          throw new TRPCError({ code: "NOT_FOUND", message: error.message });
        }
        if (error instanceof ReportForbiddenError) {
          throw new TRPCError({ code: "FORBIDDEN", message: error.message });
        }
        if (error instanceof TRPCError) throw error;
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
      const { limit, offset, search } = input;
      try {
        return await reportCatalog.getPublicReports.execute({
          limit,
          offset,
          search,
        });
      } catch (error) {
        if (error instanceof ReportValidationError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
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
      const { reportId } = input;
      try {
        return await reportCatalog.getPublicReportById.execute(reportId);
      } catch (error) {
        if (error instanceof ReportValidationError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        if (error instanceof ReportNotFoundError) {
          throw new TRPCError({ code: "NOT_FOUND", message: error.message });
        }
        if (error instanceof TRPCError) throw error;
        console.error("Failed to fetch public report:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch report",
        });
      }
    }),
});
