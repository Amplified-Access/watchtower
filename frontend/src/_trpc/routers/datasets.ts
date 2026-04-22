import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../trpc";
import { superAdminProcedure } from "../middleware";
import { datasetsApi } from "@/lib/api/datasets";

export const datasetsRouter = router({
  getPublicDatasets: publicProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(12),
        search: z.string().optional(),
        category: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const res = await datasetsApi.getPublicDatasets(
        { limit: input.limit, offset: (input.page - 1) * input.limit, search: input.search },
        input.category
      );
      if (!res.success) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: res.error ?? "Failed" });
      }
      return {
        data: res.data?.data ?? [],
        total: res.data?.total ?? 0,
      };
    }),

  getDatasetById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const res = await datasetsApi.getDatasetById(input.id);
      if (!res.success) {
        if (res.error?.includes("404")) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Dataset not found" });
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: res.error ?? "Failed" });
      }
      return res.data;
    }),

  incrementDatasetDownload: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const res = await datasetsApi.incrementDownload(input.id);
      if (!res.success) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: res.error ?? "Failed" });
      }
      return { success: true };
    }),

  getDatasetCategories: publicProcedure.query(async () => {
    const res = await datasetsApi.getCategories();
    if (!res.success) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: res.error ?? "Failed" });
    }
    return res.data ?? [];
  }),

  uploadDataset: superAdminProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        category: z.string(),
        fileKey: z.string(),
        fileName: z.string(),
        fileSize: z.number(),
        fileType: z.string(),
        format: z.string(),
        tags: z.array(z.string()).optional(),
        keywords: z.array(z.string()).optional(),
        source: z.string().optional(),
        license: z.string().optional(),
        coverage: z.string().optional(),
        methodology: z.string().optional(),
        isPublic: z.boolean().default(false),
      }),
    )
    .mutation(async ({ input }) => {
      const res = await datasetsApi.createDataset(input);
      if (!res.success) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: res.error ?? "Failed" });
      }
      return res.data;
    }),

  getAllDatasets: superAdminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        search: z.string().optional(),
        includePrivate: z.boolean().optional(),
      }),
    )
    .query(async ({ input }) => {
      const res = await datasetsApi.getAllDatasets({
        limit: input.limit,
        offset: (input.page - 1) * input.limit,
        search: input.search,
      });
      if (!res.success) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: res.error ?? "Failed" });
      }
      return {
        data: res.data?.data ?? [],
        total: res.data?.total ?? 0,
      };
    }),

  updateDataset: superAdminProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        source: z.string().optional(),
        license: z.string().optional(),
        coverage: z.string().optional(),
        methodology: z.string().optional(),
      }),
    )
    .mutation(async () => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Update not yet available" });
    }),

  deleteDataset: superAdminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const res = await datasetsApi.deleteDataset(input.id);
      if (!res.success) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: res.error ?? "Failed" });
      }
      return { success: true };
    }),
});
