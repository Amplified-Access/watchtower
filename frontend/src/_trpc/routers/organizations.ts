import { TRPCError } from "@trpc/server";
import z from "zod";
import { publicProcedure, router } from "../trpc";
import { organizationsApi } from "@/lib/api/organizations";

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
        const res = await organizationsApi.list({ search, limit, offset });
        if (!res.success) throw new Error(res.error ?? "Failed to fetch organizations");
        return { data: res.data?.data ?? [], total: res.data?.total ?? 0 };
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
        const res = await organizationsApi.getBySlug(input.slug);
        if (!res.success) {
          if (res.error?.includes("404")) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
          }
          throw new Error(res.error ?? "Failed to fetch organization");
        }
        return res.data ?? null;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error fetching organization:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch organization",
        });
      }
    }),
});
