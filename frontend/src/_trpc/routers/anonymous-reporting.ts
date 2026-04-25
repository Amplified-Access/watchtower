import z from "zod";
import { router, publicProcedure } from "../trpc";
import { incidentsApi } from "@/lib/api/incidents";

const COUNTRY_CENTERS: Record<string, { lat: number; lon: number }> = {
  Kenya: { lat: -0.0236, lon: 37.9062 },
  Uganda: { lat: 1.3733, lon: 32.2903 },
  Tanzania: { lat: -6.3690, lon: 34.8888 },
  Rwanda: { lat: -1.9403, lon: 29.8739 },
  Ethiopia: { lat: 9.1450, lon: 40.4897 },
  Nigeria: { lat: 9.0820, lon: 8.6753 },
  Ghana: { lat: 7.9465, lon: -1.0232 },
  "South Africa": { lat: -30.5595, lon: 22.9375 },
  Egypt: { lat: 26.8206, lon: 30.8025 },
  Sudan: { lat: 12.8628, lon: 30.2176 },
  Somalia: { lat: 5.1521, lon: 46.1996 },
  DRC: { lat: -4.0383, lon: 21.7587 },
  "Democratic Republic of Congo": { lat: -4.0383, lon: 21.7587 },
  Cameroon: { lat: 3.8480, lon: 11.5021 },
  Senegal: { lat: 14.4974, lon: -14.4524 },
  Pakistan: { lat: 30.3753, lon: 69.3451 },
  India: { lat: 20.5937, lon: 78.9629 },
  Bangladesh: { lat: 23.6850, lon: 90.3563 },
  Afghanistan: { lat: 33.9391, lon: 67.7100 },
  Myanmar: { lat: 21.9162, lon: 95.9560 },
};

interface RawAnonymousReport {
  id: string;
  incidentTypeId: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    country?: string;
    name?: string;
  };
  description: string;
  injuries: number;
  fatalities: number;
}

export interface CombinedIncidentReport {
  lat: string | number;
  lon: string | number;
  totalReports: number | string;
  totalInjuries: number | string;
  totalFatalities: number | string;
  displayName: string;
  incidentTypeColor?: string;
  incidentTypeDescriptions?: string;
}

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

  searchLocation: publicProcedure
    .input(z.object({ searchTerm: z.string() }))
    .query(async ({ input }) => {
      try {
        const apiKey = process.env.LOCATION_IQ_API_KEY;
        if (!apiKey) return { success: true, data: [] };
        const url = `https://us1.locationiq.com/v1/search.php?key=${apiKey}&q=${encodeURIComponent(input.searchTerm)}&format=json&limit=5`;
        const res = await fetch(url);
        if (!res.ok) return { success: true, data: [] };
        const data = await res.json();
        return { success: true, data };
      } catch (error) {
        console.error("Failed to search location:", error);
        return { success: false, message: "Failed to fetch places.", data: [] };
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

  getAllAnonymousIncidentReports: publicProcedure
    .input(
      z.object({
        country: z.string().optional(),
        category: z.string().optional(),
        sources: z.array(z.string()).optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      try {
        const res = await incidentsApi.getAnonymousReports({
          country: input.country,
          category: input.category,
        });
        if (!res.success) throw new Error(res.error ?? "Failed to fetch reports");
        return { success: true, data: res.data ?? [] };
      } catch (error) {
        console.error("Failed to fetch anonymous incident reports:", error);
        return { success: false, message: "Failed to fetch reports", data: [] };
      }
    }),

  getAfricawideHeatmapData: publicProcedure.query(async () => {
    try {
      const res = await incidentsApi.getHeatmapData();
      if (!res.success) throw new Error(res.error ?? "Failed to fetch heatmap data");
      return { success: true, data: res.data };
    } catch (error) {
      console.error("Failed to fetch heatmap data:", error);
      return { success: false, message: "Failed to fetch heatmap data", data: [] };
    }
  }),

  getCombinedIncidentReports: publicProcedure
    .input(
      z.object({
        country: z.string().optional(),
        category: z.string().optional(),
        search: z.string().optional(),
        timeframe: z.enum(["week", "month", "year"]).optional(),
      }),
    )
    .query(async ({ input }) => {
      try {
        const res = await incidentsApi.getAnonymousReports({
          country: input.country,
          category: input.category,
        });
        if (!res.success) throw new Error(res.error ?? "Failed to fetch reports");

        const combined: CombinedIncidentReport[] = (
          (res.data ?? []) as RawAnonymousReport[]
        )
          .filter((r) => r.location != null)
          .map((r) => {
            const hasCoords =
              r.location.latitude !== 0 || r.location.longitude !== 0;
            const fallback =
              r.location.country
                ? COUNTRY_CENTERS[r.location.country]
                : undefined;
            const lat = hasCoords
              ? r.location.latitude
              : fallback?.lat;
            const lon = hasCoords
              ? r.location.longitude
              : fallback?.lon;
            return {
              lat,
              lon,
              totalReports: 1,
              totalInjuries: r.injuries ?? 0,
              totalFatalities: r.fatalities ?? 0,
              displayName:
                r.location.name ??
                r.location.address ??
                r.location.country ??
                "Unknown Location",
              incidentTypeDescriptions: r.description,
            };
          })
          .filter((r) => r.lat != null && r.lon != null) as CombinedIncidentReport[];

        return { success: true, data: combined };
      } catch (error) {
        console.error("Failed to fetch combined incident reports:", error);
        return { success: false, message: "Failed to fetch reports", data: [] as CombinedIncidentReport[] };
      }
    }),
});
