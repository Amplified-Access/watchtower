import { publicProcedure, router } from "../trpc";
import { organizationProcedure, protectedProcedure } from "../middleware";
import { organizationApplicationSchema } from "@/features/organization-registration/schemas/organization-registration-scema";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { anonymousReportingRouter } from "./anonymous-reporting";
import { organizationReportingRouter } from "./organization-reporting";
import { notificationRouter } from "./notifications";
import { alertSubscriptionsRouter } from "./alert-subscriptions";
import { adminRouter } from "./admin";
import { superAdminRouter } from "./super-admin";
import { datasetsRouter } from "./datasets";
import { createOrganizationRegistrationUseCases } from "@/features/organization-registration";
import {
  createWatcherUseCases,
  WatcherNotFoundError,
  WatcherValidationError,
  WatcherForbiddenError,
} from "@/features/watcher";
import {
  createReportCatalogUseCases,
  ReportForbiddenError,
  ReportNotFoundError,
  ReportValidationError,
} from "@/features/reports";
import {
  createOrganizationDirectoryUseCases,
  OrganizationDirectoryValidationError,
  OrganizationNotFoundError,
} from "@/features/organizations";
import {
  createInsightCatalogUseCases,
  InsightNotFoundError,
  InsightValidationError,
} from "@/features/insights";

const organizationRegistration = createOrganizationRegistrationUseCases();
const watcherFeature = createWatcherUseCases();
const reportCatalog = createReportCatalogUseCases();
const organizationDirectory = createOrganizationDirectoryUseCases();
const insightCatalog = createInsightCatalogUseCases();

const coreRouter = router({
  healthCheck: publicProcedure.query(() => {
    return { data: "OK" };
  }),

  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),

  submitOrganizationApplication: publicProcedure
    .input(organizationApplicationSchema)
    .mutation(async (opts) => {
      const { input } = opts;
      console.log("Received organization application:", input);
      try {
        return await organizationRegistration.submitOrganizationApplication.execute(
          input,
        );
      } catch (error) {
        console.error("Error inserting organization application:", error);
        return {
          success: false,
          message: "Failed to submit organization application.",
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),

  getAllOrganizatons: publicProcedure.query(async () => {
    try {
      return await organizationRegistration.getAllOrganizations.execute();
    } catch (error) {
      console.error("Error fetching organizations: ", error);
      return {
        success: false,
        message: "Failed to fetch organizations.",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }),

  submitIncident: protectedProcedure
    .input(
      z.object({
        formId: z.string(),
        data: z.record(z.string(), z.any()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await watcherFeature.submitIncident.execute({
          formId: input.formId,
          data: input.data,
          actor: {
            userId: ctx.user.id,
            role: ctx.user.role ?? "",
            organizationId: ctx.user.organizationId,
          },
        });
      } catch (error) {
        if (error instanceof WatcherNotFoundError) {
          throw new TRPCError({ code: "NOT_FOUND", message: error.message });
        }
        if (error instanceof WatcherValidationError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        if (error instanceof WatcherForbiddenError) {
          throw new TRPCError({ code: "FORBIDDEN", message: error.message });
        }
        console.error("Failed to submit incident:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit incident report",
        });
      }
    }),

  getActiveFormsForWatcher: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await watcherFeature.getActiveFormsForWatcher.execute({
        userId: ctx.user.id,
        role: ctx.user.role ?? "",
        organizationId: ctx.user.organizationId,
      });
    } catch (error) {
      if (error instanceof WatcherValidationError) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      }
      console.error("Failed to fetch active forms:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch active forms",
      });
    }
  }),

  // =============================================================================
  // REPORTS — pending Clean Architecture migration
  // =============================================================================

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

  // =============================================================================
  // INSIGHTS — pending Clean Architecture migration
  // =============================================================================

  getPublicInsights: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        search: z.string().optional(),
        tagId: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const { limit, offset, search, tagId } = input;
      try {
        return await insightCatalog.getPublicInsights.execute({
          limit,
          offset,
          search,
          tagId,
        });
      } catch (error) {
        if (error instanceof InsightValidationError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        console.error("Failed to fetch public insights:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch insights",
        });
      }
    }),

  getPublicInsightBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const { slug } = input;
      try {
        return await insightCatalog.getPublicInsightBySlug.execute(slug);
      } catch (error) {
        if (error instanceof InsightValidationError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        if (error instanceof InsightNotFoundError) {
          throw new TRPCError({ code: "NOT_FOUND", message: error.message });
        }
        if (error instanceof TRPCError) throw error;
        console.error("Failed to fetch public insight:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch insight",
        });
      }
    }),

  getInsightTags: publicProcedure.query(async () => {
    try {
      return await insightCatalog.getInsightTags.execute();
    } catch (error) {
      console.error("Failed to fetch insight tags:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch tags",
      });
    }
  }),

  createInsight: organizationProcedure
    .input(
      z.object({
        title: z.string().min(1, "Title is required"),
        slug: z.string().min(1, "Slug is required"),
        description: z.string().min(1, "Description is required"),
        content: z.any().optional(),
        imageUrl: z.string().optional(),
        imageAlt: z.string().optional(),
        tagIds: z.array(z.string()).default([]),
        status: z.enum(["draft", "published"]).default("draft"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const {
        title,
        slug,
        description,
        content,
        imageUrl,
        imageAlt,
        tagIds,
        status,
      } = input;
      try {
        return await insightCatalog.createInsight.execute({
          title,
          slug,
          description,
          content,
          imageUrl,
          imageAlt,
          tagIds,
          status,
          actor: {
            userId: ctx.user.id,
            role: ctx.user.role ?? "",
            organizationId: ctx.user.organizationId,
          },
        });
      } catch (error) {
        if (error instanceof InsightValidationError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        console.error("Failed to create insight:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create insight",
        });
      }
    }),

  // =============================================================================
  // ORGANIZATIONS — pending Clean Architecture migration
  // =============================================================================

  getPublicOrganizations: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        limit: z.number().min(1).max(50).default(12),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ input }) => {
      try {
        const { search, limit, offset } = input;
        return await organizationDirectory.getPublicOrganizations.execute({
          search,
          limit,
          offset,
        });
      } catch (error) {
        if (error instanceof OrganizationDirectoryValidationError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        console.error("Error fetching organizations:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch organizations",
        });
      }
    }),

  getOrganizationBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      try {
        return await organizationDirectory.getOrganizationBySlug.execute(
          input.slug,
        );
      } catch (error) {
        if (error instanceof OrganizationDirectoryValidationError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        if (error instanceof OrganizationNotFoundError) {
          throw new TRPCError({ code: "NOT_FOUND", message: error.message });
        }
        if (error instanceof TRPCError) throw error;
        console.error("Error fetching organization:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch organization",
        });
      }
    }),

  anonymousReports: anonymousReportingRouter,
  organizationReports: organizationReportingRouter,
  notifications: notificationRouter,
  alertSubscriptions: alertSubscriptionsRouter,
});

export const appRouter = router({
  ...coreRouter._def.record,
  ...adminRouter._def.record,
  ...superAdminRouter._def.record,
  ...datasetsRouter._def.record,
});

export type AppRouter = typeof appRouter;
