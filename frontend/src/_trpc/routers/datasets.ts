import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../trpc";
import { superAdminProcedure } from "../middleware";
import {
  datasetUploadSchema,
  datasetUpdateSchema,
  datasetFilterSchema,
} from "@/features/datasets/schemas/dataset-schema";
import { createDatasetsUseCases } from "@/features/datasets";

const datasetsFeature = createDatasetsUseCases();

export const datasetsRouter = router({
  getPublicDatasets: publicProcedure
    .input(datasetFilterSchema)
    .query(async ({ input }) => {
      try {
        return await datasetsFeature.getPublicDatasets.execute({
          ...input,
          page: input.page,
          limit: input.limit,
        });
      } catch (error) {
        console.error("Error fetching public datasets:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch datasets",
        });
      }
    }),

  getDatasetById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      try {
        const dataset = await datasetsFeature.getDatasetById.execute(input.id);
        if (!dataset) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Dataset not found" });
        }
        return dataset;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error fetching dataset:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch dataset",
        });
      }
    }),

  incrementDatasetDownload: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      try {
        return await datasetsFeature.incrementDatasetDownload.execute(input.id);
      } catch (error) {
        console.error("Error incrementing download count:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update download count",
        });
      }
    }),

  getDatasetCategories: publicProcedure.query(async () => {
    try {
      return await datasetsFeature.getDatasetCategories.execute();
    } catch (error) {
      console.error("Error fetching dataset categories:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch categories",
      });
    }
  }),

  uploadDataset: superAdminProcedure
    .input(
      datasetUploadSchema.extend({
        fileKey: z.string(),
        fileName: z.string(),
        fileSize: z.number(),
        fileType: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        return await datasetsFeature.uploadDataset.execute(input);
      } catch (error) {
        console.error("Error uploading dataset:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload dataset",
        });
      }
    }),

  getAllDatasets: superAdminProcedure
    .input(
      datasetFilterSchema.extend({
        includePrivate: z.boolean().optional().default(true),
      }),
    )
    .query(async ({ input }) => {
      try {
        return await datasetsFeature.getAllDatasets.execute({
          ...input,
          page: input.page,
          limit: input.limit,
          includePrivate: input.includePrivate,
        });
      } catch (error) {
        console.error("Error fetching all datasets:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch datasets",
        });
      }
    }),

  updateDataset: superAdminProcedure
    .input(datasetUpdateSchema)
    .mutation(async ({ input }) => {
      try {
        const updatedDataset = await datasetsFeature.updateDataset.execute(input);
        if (!updatedDataset) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Dataset not found" });
        }
        return {
          success: true,
          message: "Dataset updated successfully",
          dataset: updatedDataset,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error updating dataset:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update dataset",
        });
      }
    }),

  deleteDataset: superAdminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      try {
        const deletedDataset = await datasetsFeature.deleteDataset.execute(
          input.id,
        );
        if (!deletedDataset) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Dataset not found" });
        }
        return { success: true, message: "Dataset deleted successfully" };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error deleting dataset:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete dataset",
        });
      }
    }),
});
