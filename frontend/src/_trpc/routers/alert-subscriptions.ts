import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { alertsApi } from "@/lib/api/alerts";

const LocationSchema = z.object({
  lat: z.number(),
  lon: z.number(),
  radius: z.number().optional(),
});

const AlertSubscriptionInputSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().optional(),
  phone: z.string().optional(),
  incidentTypes: z.array(z.string()).min(1),
  locations: z.array(LocationSchema).min(1),
  severityLevels: z.array(z.enum(["low", "medium", "high", "critical"])).min(1),
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  alertFrequency: z.enum(["immediate", "hourly", "daily", "weekly"]).default("immediate"),
  preferredLanguage: z.string().default("en"),
  timezone: z.string().default("UTC"),
});

const UpdateSubscriptionSchema = AlertSubscriptionInputSchema.partial().extend({
  id: z.string(),
});

export const alertSubscriptionsRouter = router({
  create: publicProcedure
    .input(AlertSubscriptionInputSchema)
    .mutation(async ({ input }) => {
      try {
        const mappedData = {
          ...input,
          locations: input.locations.map((loc) => ({
            latitude: loc.lat,
            longitude: loc.lon,
            radius: loc.radius,
          })),
        };
        const res = await alertsApi.create(mappedData as any);
        if (!res.success) throw new Error(res.error ?? "Failed to create subscription");
        return { success: true, message: "Subscription created successfully" };
      } catch (error) {
        console.error("Error creating alert subscription:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to subscribe to alerts",
        });
      }
    }),

  update: publicProcedure
    .input(UpdateSubscriptionSchema)
    .mutation(async ({ input }) => {
      try {
        const { id, ...data } = input;
        const mappedData = {
          ...data,
          locations: data.locations?.map((loc) => ({
            latitude: loc.lat,
            longitude: loc.lon,
            radius: loc.radius,
          })),
        };
        const res = await alertsApi.update(id, mappedData as any);
        if (!res.success) throw new Error(res.error ?? "Failed to update subscription");
        return { success: true, message: "Subscription updated successfully" };
      } catch (error) {
        console.error("Error updating alert subscription:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update alert subscription",
        });
      }
    }),

  deactivate: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      try {
        const subRes = await alertsApi.getByEmail(input.email);
        if (!subRes.success || !subRes.data?.length) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Subscription not found" });
        }
        const res = await alertsApi.deactivate(subRes.data[0].id);
        if (!res.success) throw new Error(res.error ?? "Failed to deactivate");
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error deactivating subscription:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to unsubscribe from alerts",
        });
      }
    }),

  activate: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      try {
        const subRes = await alertsApi.getByEmail(input.email);
        if (!subRes.success || !subRes.data?.length) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Subscription not found" });
        }
        const res = await alertsApi.activate(subRes.data[0].id);
        if (!res.success) throw new Error(res.error ?? "Failed to activate");
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error activating subscription:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to reactivate alert subscription",
        });
      }
    }),

  getAllActive: publicProcedure.query(async () => {
    try {
      const res = await alertsApi.getAllActive();
      if (!res.success) throw new Error(res.error ?? "Failed to fetch active subscriptions");
      return { success: true, data: res.data };
    } catch (error) {
      console.error("Error fetching active subscriptions:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch subscriptions",
      });
    }
  }),

  getStats: publicProcedure.query(async () => {
    try {
      const res = await alertsApi.getStats();
      if (!res.success) throw new Error(res.error ?? "Failed to fetch subscription stats");
      return { success: true, data: res.data };
    } catch (error) {
      console.error("Error fetching subscription stats:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch subscription statistics",
      });
    }
  }),
});
