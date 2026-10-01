import z from "zod";
import { router, publicProcedure } from "../trpc";
import { incidentsApi } from "@/lib/api/incidents";

export const anonymousReportingRouter = router({
  getAllIncidentTypes: publicProcedure.query(async () => {
    try {
      const res = await incidentsApi.getAllTypes(true);
      if (!res.success) throw new Error(res.error ?? "Failed to fetch incident types");
      return { success: true, data: res.data };
    } catch (error) {
      console.error("Failed to fetch incident types:", error);
      return { success: false, message: "Failed to fetch incident types.", data: [] };
    }
  }),

  getActiveIncidentTypesForMaps: publicProcedure.query(async () => {
    try {
      const res = await incidentsApi.getAllTypes(true);
      if (!res.success) throw new Error(res.error ?? "Failed to fetch incident types");
      return { success: true, data: res.data };
    } catch (error) {
      console.error("Failed to fetch incident types for maps:", error);
      return { success: false, message: "Failed to fetch incident types.", data: [] };
    }
  }),

  submitAmonymousIncidentReport: publicProcedure
    .input(
      z.object({
        incidentTypeId: z.string(),
        location: z.object({
          latitude: z.number(),
          longitude: z.number(),
          address: z.string().optional(),
          country: z.string().optional(),
        }),
        description: z.string(),
        entities: z.array(z.string()).optional(),
        injuries: z.number().optional(),
        fatalities: z.number().optional(),
        evidenceFileKey: z.string().optional(),
        audioFileKey: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const res = await incidentsApi.submitAnonymousReport({
          incidentTypeId: input.incidentTypeId,
          location: input.location,
          description: input.description,
          entities: input.entities,
          injuries: input.injuries,
          fatalities: input.fatalities,
          evidenceFileKey: input.evidenceFileKey,
          audioFileKey: input.audioFileKey,
        });
        if (!res.success) throw new Error(res.error ?? "Failed to submit incident");
        return { success: true };
      } catch (error) {
        console.error("Failed to submit incident report:", error);
        throw new Error("Failed to submit incident report");
      }
    }),
});
