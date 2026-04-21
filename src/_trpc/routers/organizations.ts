import { TRPCError } from "@trpc/server";
import z from "zod";
import { publicProcedure, router } from "../trpc";
import {
  createOrganizationDirectoryUseCases,
  OrganizationDirectoryValidationError,
  OrganizationNotFoundError,
} from "@/features/organizations";

const organizationDirectory = createOrganizationDirectoryUseCases();

export const organizationsRouter = router({
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
});
