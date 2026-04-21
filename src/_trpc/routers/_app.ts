import { db } from "@/db";
import { mergeRouters } from "@trpc/server";
import { publicProcedure, router } from "../trpc";
import { organizationProcedure, protectedProcedure } from "../middleware";
import { organizationApplicationSchema } from "@/features/organization-registration/schemas/organization-registration-scema";
import z from "zod";
import { organizations } from "@/db/schemas/organizations";
import { eq, and, count, desc, ilike } from "drizzle-orm";
import { user } from "@/db/schemas/auth";
import { TRPCError } from "@trpc/server";
import { reports } from "@/db/schemas/reports";
import {
  insights,
  insightTags,
  insightTagRelations,
} from "@/db/schemas/insights";
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
  ReportNotFoundError,
  ReportValidationError,
} from "@/features/reports";

const organizationRegistration = createOrganizationRegistrationUseCases();
const watcherFeature = createWatcherUseCases();
const reportCatalog = createReportCatalogUseCases();

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
        const userWithOrg = ctx.user as typeof ctx.user & {
          organizationId?: string;
        };
        if (!userWithOrg.organizationId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "User must be associated with an organization",
          });
        }
        const [newReport] = await db
          .insert(reports)
          .values({
            organizationId: userWithOrg.organizationId,
            reportedById: ctx.user.id,
            title,
            fileKey,
            status,
          })
          .returning();
        return {
          success: true,
          message: "Report created successfully",
          reportId: newReport.id,
        };
      } catch (error) {
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
      if (ctx.user.role !== "super-admin") {
        const userWithOrg = ctx.user as typeof ctx.user & {
          organizationId?: string;
        };
        if (userWithOrg.organizationId !== organizationId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only access reports from your own organization",
          });
        }
      }
      try {
        const whereConditions = [eq(reports.organizationId, organizationId)];
        if (status !== "all") {
          whereConditions.push(eq(reports.status, status));
        }
        const data = await db
          .select({
            id: reports.id,
            organizationId: reports.organizationId,
            reportedById: reports.reportedById,
            title: reports.title,
            fileKey: reports.fileKey,
            status: reports.status,
            createdAt: reports.createdAt,
            updatedAt: reports.updatedAt,
            authorName: user.name,
            authorEmail: user.email,
          })
          .from(reports)
          .leftJoin(user, eq(reports.reportedById, user.id))
          .where(and(...whereConditions))
          .orderBy(desc(reports.updatedAt))
          .limit(limit)
          .offset(offset);
        const totalCountResult = await db
          .select({ count: count() })
          .from(reports)
          .where(and(...whereConditions));
        const totalCount = totalCountResult[0]?.count || 0;
        return {
          reports: data,
          totalCount,
          hasMore: offset + data.length < totalCount,
        };
      } catch (error) {
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
        const [report] = await db
          .select({
            id: reports.id,
            organizationId: reports.organizationId,
            reportedById: reports.reportedById,
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
          .where(eq(reports.id, reportId))
          .limit(1);
        if (!report) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Report not found",
          });
        }
        if (ctx.user.role !== "super-admin") {
          const userWithOrg = ctx.user as typeof ctx.user & {
            organizationId?: string;
          };
          if (userWithOrg.organizationId !== report.organizationId) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You can only access reports from your own organization",
            });
          }
        }
        return report;
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
    .mutation(async ({ input, ctx }) => {
      const { reportId, title, status } = input;
      try {
        const [existingReport] = await db
          .select()
          .from(reports)
          .where(eq(reports.id, reportId))
          .limit(1);
        if (!existingReport) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Report not found",
          });
        }
        if (ctx.user.role !== "super-admin") {
          const userWithOrg = ctx.user as typeof ctx.user & {
            organizationId?: string;
          };
          if (userWithOrg.organizationId !== existingReport.organizationId) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You can only update reports from your own organization",
            });
          }
        }
        const updateData: Record<string, unknown> = { updatedAt: new Date() };
        if (title !== undefined) updateData.title = title;
        if (status !== undefined) updateData.status = status;
        await db
          .update(reports)
          .set(updateData)
          .where(eq(reports.id, reportId));
        return { success: true, message: "Report updated successfully" };
      } catch (error) {
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
        const [existingReport] = await db
          .select()
          .from(reports)
          .where(eq(reports.id, reportId))
          .limit(1);
        if (!existingReport) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Report not found",
          });
        }
        if (ctx.user.role !== "super-admin") {
          const userWithOrg = ctx.user as typeof ctx.user & {
            organizationId?: string;
          };
          if (userWithOrg.organizationId !== existingReport.organizationId) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You can only delete reports from your own organization",
            });
          }
        }
        await db.delete(reports).where(eq(reports.id, reportId));
        return { success: true, message: "Report deleted successfully" };
      } catch (error) {
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
        const whereConditions = [eq(insights.status, "published")];
        if (search) {
          whereConditions.push(ilike(insights.title, `%${search}%`));
        }
        let query = db
          .select({
            id: insights.id,
            title: insights.title,
            slug: insights.slug,
            description: insights.description,
            imageUrl: insights.imageUrl,
            imageAlt: insights.imageAlt,
            publishedAt: insights.publishedAt,
            createdAt: insights.createdAt,
            authorName: user.name,
            organizationName: organizations.name,
          })
          .from(insights)
          .leftJoin(user, eq(insights.authorId, user.id))
          .leftJoin(
            organizations,
            eq(insights.organizationId, organizations.id),
          )
          .where(and(...whereConditions))
          .orderBy(desc(insights.publishedAt))
          .limit(limit)
          .offset(offset);
        if (tagId) {
          query = db
            .select({
              id: insights.id,
              title: insights.title,
              slug: insights.slug,
              description: insights.description,
              imageUrl: insights.imageUrl,
              imageAlt: insights.imageAlt,
              publishedAt: insights.publishedAt,
              createdAt: insights.createdAt,
              authorName: user.name,
              organizationName: organizations.name,
            })
            .from(insights)
            .leftJoin(user, eq(insights.authorId, user.id))
            .leftJoin(
              organizations,
              eq(insights.organizationId, organizations.id),
            )
            .innerJoin(
              insightTagRelations,
              eq(insights.id, insightTagRelations.insightId),
            )
            .where(
              and(...whereConditions, eq(insightTagRelations.tagId, tagId)),
            )
            .orderBy(desc(insights.publishedAt))
            .limit(limit)
            .offset(offset);
        }
        return await query;
      } catch (error) {
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
        const [insight] = await db
          .select({
            id: insights.id,
            title: insights.title,
            slug: insights.slug,
            description: insights.description,
            content: insights.content,
            imageUrl: insights.imageUrl,
            imageAlt: insights.imageAlt,
            publishedAt: insights.publishedAt,
            createdAt: insights.createdAt,
            authorName: user.name,
            authorEmail: user.email,
            organizationName: organizations.name,
          })
          .from(insights)
          .leftJoin(user, eq(insights.authorId, user.id))
          .leftJoin(
            organizations,
            eq(insights.organizationId, organizations.id),
          )
          .where(and(eq(insights.slug, slug), eq(insights.status, "published")))
          .limit(1);
        if (!insight) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Insight not found",
          });
        }
        const tags = await db
          .select({
            id: insightTags.id,
            title: insightTags.title,
            slug: insightTags.slug,
          })
          .from(insightTags)
          .innerJoin(
            insightTagRelations,
            eq(insightTags.id, insightTagRelations.tagId),
          )
          .where(eq(insightTagRelations.insightId, insight.id));
        return { ...insight, tags };
      } catch (error) {
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
      return await db
        .select({
          id: insightTags.id,
          title: insightTags.title,
          slug: insightTags.slug,
        })
        .from(insightTags)
        .orderBy(insightTags.title);
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
        const userWithOrg = ctx.user as typeof ctx.user & {
          organizationId?: string;
        };
        const [newInsight] = await db
          .insert(insights)
          .values({
            title,
            slug,
            description,
            content,
            imageUrl,
            imageAlt,
            authorId: ctx.user.id,
            organizationId: userWithOrg.organizationId,
            status,
            publishedAt: status === "published" ? new Date() : null,
          })
          .returning();
        if (tagIds.length > 0) {
          await db
            .insert(insightTagRelations)
            .values(
              tagIds.map((tagId) => ({ insightId: newInsight.id, tagId })),
            );
        }
        return {
          success: true,
          message: "Insight created successfully",
          insightId: newInsight.id,
        };
      } catch (error) {
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
        const whereConditions = [];
        if (search) {
          whereConditions.push(ilike(organizations.name, `%${search}%`));
        }
        const baseSelect = db
          .select({
            id: organizations.id,
            name: organizations.name,
            slug: organizations.slug,
            description: organizations.description,
            website: organizations.website,
            location: organizations.location,
            contactEmail: organizations.contactEmail,
            createdAt: organizations.createdAt,
          })
          .from(organizations);
        const result =
          whereConditions.length > 0
            ? await baseSelect
                .where(
                  whereConditions.length === 1
                    ? whereConditions[0]
                    : and(...whereConditions),
                )
                .orderBy(desc(organizations.createdAt))
                .limit(limit)
                .offset(offset)
            : await baseSelect
                .orderBy(desc(organizations.createdAt))
                .limit(limit)
                .offset(offset);
        const baseCount = db.select({ count: count() }).from(organizations);
        const [{ count: total }] =
          whereConditions.length > 0
            ? await baseCount.where(
                whereConditions.length === 1
                  ? whereConditions[0]
                  : and(...whereConditions),
              )
            : await baseCount;
        return {
          organizations: result,
          total,
          hasMore: offset + limit < total,
        };
      } catch (error) {
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
        const [organization] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.slug, input.slug))
          .limit(1);
        if (!organization) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Organization not found",
          });
        }
        return organization;
      } catch (error) {
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

export const appRouter = mergeRouters(
  coreRouter,
  adminRouter,
  superAdminRouter,
  datasetsRouter,
);

export type AppRouter = typeof appRouter;
