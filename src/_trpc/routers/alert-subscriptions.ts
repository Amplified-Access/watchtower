import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { db } from "@/db";
import { alertSubscriptions } from "@/db/schemas/alert-subscriptions";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

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
        // Check if subscription already exists for this email
        const existingSubscription = await db
          .select()
          .from(alertSubscriptions)
          .where(eq(alertSubscriptions.email, input.email))
          .limit(1);

        if (existingSubscription.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "An alert subscription already exists for this email address",
          });
        }

        // Create new subscription
        const [newSubscription] = await db
          .insert(alertSubscriptions)
          .values({
            email: input.email,
            name: input.name,
            phone: input.phone || null,
            incidentTypes: input.incidentTypes,
            locations: input.locations,
            severityLevels: input.severityLevels,
            emailNotifications: input.emailNotifications,
            smsNotifications: input.smsNotifications,
            alertFrequency: input.alertFrequency,
            preferredLanguage: input.preferredLanguage,
            timezone: input.timezone,
            isActive: true,
          })
          .returning();

        return {
          success: true,
          subscription: newSubscription,
          message: "Successfully subscribed to alerts!",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
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
        const subscription = await db
          .select()
          .from(alertSubscriptions)
          .where(eq(alertSubscriptions.email, input.email))
          .limit(1);

        return subscription[0] || null;
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
        const { id, ...updateData } = input;

        // Check if subscription exists
        const existingSubscription = await db
          .select()
          .from(alertSubscriptions)
          .where(eq(alertSubscriptions.id, id))
          .limit(1);

        if (existingSubscription.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Alert subscription not found",
          });
        }

        // Update subscription
        const [updatedSubscription] = await db
          .update(alertSubscriptions)
          .set({
            ...updateData,
            updatedAt: new Date(),
          })
          .where(eq(alertSubscriptions.id, id))
          .returning();

        return {
          success: true,
          subscription: updatedSubscription,
          message: "Subscription updated successfully!",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
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
      })
    )
    .mutation(async ({ input }) => {
      try {
        const [deactivatedSubscription] = await db
          .update(alertSubscriptions)
          .set({
            isActive: false,
            updatedAt: new Date(),
          })
          .where(eq(alertSubscriptions.email, input.email))
          .returning();

        if (!deactivatedSubscription) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Alert subscription not found",
          });
        }

        return {
          success: true,
          message: "Successfully unsubscribed from alerts",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
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
        const [activatedSubscription] = await db
          .update(alertSubscriptions)
          .set({
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(alertSubscriptions.email, input.email))
          .returning();

        if (!activatedSubscription) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Alert subscription not found",
          });
        }

        return {
          success: true,
          subscription: activatedSubscription,
          message: "Successfully reactivated alert subscription",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
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
      const subscriptions = await db
        .select({
          id: alertSubscriptions.id,
          email: alertSubscriptions.email,
          name: alertSubscriptions.name,
          incidentTypes: alertSubscriptions.incidentTypes,
          locations: alertSubscriptions.locations,
          severityLevels: alertSubscriptions.severityLevels,
          alertFrequency: alertSubscriptions.alertFrequency,
          createdAt: alertSubscriptions.createdAt,
        })
        .from(alertSubscriptions)
        .where(eq(alertSubscriptions.isActive, true))
        .orderBy(alertSubscriptions.createdAt);

      return subscriptions;
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
      const totalSubscriptions = await db
        .select()
        .from(alertSubscriptions)
        .where(eq(alertSubscriptions.isActive, true));

      // Count by frequency
      const frequencyStats = totalSubscriptions.reduce(
        (acc: Record<string, number>, sub) => {
          const frequency = sub.alertFrequency || "immediate";
          acc[frequency] = (acc[frequency] || 0) + 1;
          return acc;
        },
        {}
      );

      // Count by incident types
      const incidentTypeStats = totalSubscriptions.reduce(
        (acc: Record<string, number>, sub) => {
          const incidentTypes = sub.incidentTypes as string[];
          incidentTypes.forEach((type: string) => {
            acc[type] = (acc[type] || 0) + 1;
          });
          return acc;
        },
        {}
      );

      return {
        totalActive: totalSubscriptions.length,
        frequencyStats,
        incidentTypeStats,
        averageIncidentTypesPerUser:
          totalSubscriptions.length > 0
            ? totalSubscriptions.reduce((sum: number, sub) => {
                const incidentTypes = sub.incidentTypes as string[];
                return sum + incidentTypes.length;
              }, 0) / totalSubscriptions.length
            : 0,
      };
    } catch (error) {
      console.error("Error fetching subscription stats:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch subscription statistics",
      });
    }
  }),
});
