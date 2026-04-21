import { TRPCError } from "@trpc/server";
import z from "zod";
import { organizationProcedure } from "../middleware";
import { publicProcedure, router } from "../trpc";
import {
  createInsightCatalogUseCases,
  InsightNotFoundError,
  InsightValidationError,
} from "@/features/insights";

const insightCatalog = createInsightCatalogUseCases();

export const insightsRouter = router({
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
});
