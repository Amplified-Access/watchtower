import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import type { ApiResponse } from "@/lib/api/client";
import { mapApi } from "@/lib/api/map";

// Pass-throughs to the Go backend's /map endpoints, which own the filtering,
// grouping and GeoJSON. Nothing here should reshape the data: if a map needs
// something new, add it to the Go response instead.

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const mapFilter = z
  .object({
    category: z.string().optional(),
    excludeTypes: z.array(z.string()).optional(),
    country: z.string().optional(),
    period: z.enum(["24h", "7d", "30d", "week", "month", "year"]).optional(),
    from: date.optional(),
    to: date.optional(),
    q: z.string().max(200).optional(),
  })
  .default({});

const unwrap = <T>(res: ApiResponse<T>, what: string): T => {
  if (!res.success || res.data === null) {
    throw new TRPCError({
      code: res.error === "report not found" ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
      message: res.error ?? `Failed to fetch ${what}`,
    });
  }
  return res.data;
};

export const mapRouter = router({
  points: publicProcedure
    .input(mapFilter)
    .query(async ({ input }) => unwrap(await mapApi.getPoints(input), "map points")),

  summary: publicProcedure
    .input(mapFilter)
    .query(async ({ input }) => unwrap(await mapApi.getSummary(input), "map summary")),

  report: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input }) => unwrap(await mapApi.getReport(input.id), "report")),
});
