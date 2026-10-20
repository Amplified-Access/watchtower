import { TRPCError } from "@trpc/server";
import z from "zod";
import { organizationProcedure } from "../middleware";
import { publicProcedure, router } from "../trpc";
import { insightsApi } from "@/lib/api/insights";

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
      const { limit, offset, search } = input;
      const res = await insightsApi.getPublicInsights({ limit, offset, search });
      if (!res.success) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: res.error ?? "Failed" });
      }
      return res.data ?? [];
    }),

  getPublicInsightBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const res = await insightsApi.getPublicInsightBySlug(input.slug);
      if (!res.success) {
        if (res.error?.includes("404")) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Insight not found" });
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: res.error ?? "Failed" });
      }
      return res.data ?? null;
    }),

  getInsightTags: publicProcedure.query(async () => {
    const res = await insightsApi.getTags();
    if (!res.success) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: res.error ?? "Failed" });
    }
    return res.data ?? [];
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
    .mutation(async ({ input }) => {
      const res = await insightsApi.createInsight(input);
      if (!res.success) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: res.error ?? "Failed" });
      }
      return res.data;
    }),
});
