import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { formSchema } from "@/features/anonymous-reporting/schemas/anonymous-incident-reproting-form-schema";
import { createAnonymousReportingUseCases } from "@/features/anonymous-reporting";

const anonymousReporting = createAnonymousReportingUseCases();

export const anonymousReportingRouter = router({
  getAllIncidentTypes: publicProcedure.query(async () => {
    console.log("Fetching active incident types:");
    try {
      return await anonymousReporting.getAllIncidentTypes.execute();
    } catch (error) {
      console.error("Failed to fetch incident types: ", error);
      return {
        success: false,
        message: "Failed to fetch incident types.",
        data: [],
      };
    } finally {
      console.log("Finished fetching incident types:");
    }
  }),

  getActiveIncidentTypesForMaps: publicProcedure.query(async () => {
    console.log("Fetching incident types with multiple reports for maps:");
    try {
      return await anonymousReporting.getActiveIncidentTypesForMaps.execute();
    } catch (error) {
      console.error("Failed to fetch incident types with reports: ", error);
      return {
        success: false,
        message: "Failed to fetch incident types with multiple reports.",
        data: [],
      };
    } finally {
      console.log(
        "Finished fetching incident types with multiple reports for maps:",
      );
    }
  }),

  searchLocation: publicProcedure
    .input(
      z.object({
        searchTerm: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const { searchTerm } = input;
      try {
        console.log("Fetching places:");
        const result =
          await anonymousReporting.searchLocation.execute(searchTerm);
        console.log("response: ", result.data);
        return result;
      } catch (error) {
        console.error("Failed to fetch places: ", error);
        return {
          success: false,
          message: "Failed to fetch places.",
          data: [],
        };
      } finally {
        console.log("Finished fetching places:");
      }
    }),

  submitAmonymousIncidentReport: publicProcedure
    .input(formSchema)
    .mutation(async (opts) => {
      const { input } = opts;
      console.log("Received incident report:", input);
      try {
        console.log("Submitting incident...");

        const result =
          await anonymousReporting.submitAnonymousIncidentReport.execute(input);

        console.log("Incident report submitted successfully");
        return result;
      } catch (error) {
        console.error("Failed to submit incident report:", error);
        throw new Error("Failed to submit incident report");
      } finally {
        console.log("Finished submission of incident");
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
        console.log("Getting anonymous reports with filters:", input);
        return await anonymousReporting.getAllAnonymousIncidentReports.execute(
          input,
        );
      } catch (error) {
        console.error("Failed to fetch anonymous incident reports : ", error);
        return {
          success: false,
          message: "Failed to fetch anonymous incident reports",
          data: [],
        };
      } finally {
        console.log("Finished getting anonymous reports");
      }
    }),

  getAfricawideHeatmapData: publicProcedure.query(async () => {
    try {
      console.log("Getting africawide heatmap data");
      return await anonymousReporting.getAfricawideHeatmapData.execute();
    } catch (error) {
      console.error("Failed to fetch africawide heatmap data: ", error);
      return {
        success: false,
        message: "Failed to fetch africawide heatmap data",
        data: [],
      };
    } finally {
      console.log("Finished getting africawide heatmap data");
    }
  }),

  // Get combined incident reports
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
        console.log("🔍 Getting combined reports with filters:", input);

        const result =
          await anonymousReporting.getCombinedIncidentReports.execute(input);
        console.log(`✅ Total combined reports: ${result.data.length}`);
        return result;
      } catch (error) {
        console.error("Failed to fetch combined incident reports:", error);
        return {
          success: false,
          message: "Failed to fetch combined incident reports",
          data: [],
        };
      }
    }),
});
