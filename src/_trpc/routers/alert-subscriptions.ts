import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { createAlertSubscriptionUseCases } from "@/features/alert-subscriptions";
import {
  AlertSubscriptionAlreadyExistsError,
  AlertSubscriptionNotFoundError,
} from "@/features/alert-subscriptions/domain/errors";

const alertSubscriptionUseCases = createAlertSubscriptionUseCases();

// Input validation schemas
const LocationSchema = z.object({
  name: z.string().min(1, "Location name is required"),
  country: z.string().min(1, "Country is required"),
  radius: z.number().min(1).max(100),
  lat: z.number().optional(),
  lon: z.number().optional(),
});

const AlertSubscriptionInputSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  incidentTypes: z
    .array(z.string())
    .min(1, "At least one incident type is required"),
  locations: z
    .array(LocationSchema)
    .min(1, "At least one location is required"),
  severityLevels: z
    .array(z.enum(["low", "medium", "high", "critical"]))
    .min(1, "At least one severity level is required"),
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  alertFrequency: z
    .enum(["immediate", "hourly", "daily", "weekly"])
    .default("immediate"),
  preferredLanguage: z.string().default("en"),
  timezone: z.string().default("UTC"),
});

const UpdateSubscriptionSchema = AlertSubscriptionInputSchema.partial().extend({
  id: z.string().uuid(),
});

export const alertSubscriptionsRouter = router({
  // Create a new alert subscription
  create: publicProcedure
    .input(AlertSubscriptionInputSchema)
    .mutation(async ({ input }) => {
      try {
        return await alertSubscriptionUseCases.create.execute(input);
      } catch (error) {
        if (error instanceof AlertSubscriptionAlreadyExistsError) {
          throw new TRPCError({
            code: "CONFLICT",
            message: error.message,
          });
        }

        console.error("Error creating alert subscription:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create alert subscription",
        });
      }
    }),

  // Get subscription by email
  getByEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      try {
        return await alertSubscriptionUseCases.getByEmail.execute(input.email);
      } catch (error) {
        console.error("Error fetching subscription:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch subscription",
        });
      }
    }),

  // Update existing subscription
  update: publicProcedure
    .input(UpdateSubscriptionSchema)
    .mutation(async ({ input }) => {
      try {
        return await alertSubscriptionUseCases.update.execute(input);
      } catch (error) {
        if (error instanceof AlertSubscriptionNotFoundError) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }

        console.error("Error updating alert subscription:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update alert subscription",
        });
      }
    }),

  // Deactivate subscription (soft delete)
  deactivate: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        unsubscribeToken: z.string().optional(), // For unsubscribe links
      }),
    )
    .mutation(async ({ input }) => {
      try {
        return await alertSubscriptionUseCases.deactivate.execute(input.email);
      } catch (error) {
        if (error instanceof AlertSubscriptionNotFoundError) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }

        console.error("Error deactivating subscription:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to unsubscribe from alerts",
        });
      }
    }),

  // Reactivate subscription
  activate: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      try {
        return await alertSubscriptionUseCases.activate.execute(input.email);
      } catch (error) {
        if (error instanceof AlertSubscriptionNotFoundError) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }

        console.error("Error activating subscription:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to reactivate subscription",
        });
      }
    }),

  // Get all active subscriptions (for admin/analytics)
  getAllActive: publicProcedure.query(async () => {
    try {
      return await alertSubscriptionUseCases.getAllActive.execute();
    } catch (error) {
      console.error("Error fetching active subscriptions:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch subscriptions",
      });
    }
  }),

  // Get subscription statistics
  getStats: publicProcedure.query(async () => {
    try {
      return await alertSubscriptionUseCases.getStats.execute();
    } catch (error) {
      console.error("Error fetching subscription stats:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch subscription statistics",
      });
    }
  }),
});
