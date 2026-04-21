import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { createNotificationUseCases } from "@/features/notifications";

const notifications = createNotificationUseCases();

const publishMessageSchema = z.object({
  message: z.string().min(1, "Message is required"),
  subject: z.string().optional(),
  attributes: z.record(z.string(), z.string()).optional(),
});

const publishIncidentAlertSchema = z.object({
  id: z.string(),
  type: z.string(),
  description: z.string(),
  location: z
    .union([
      z.string(),
      z.object({
        lat: z.number(),
        lon: z.number(),
      }),
    ])
    .optional(),
  severity: z.string().optional(),
  organizationId: z.string().optional(),
});

const publishSystemAlertSchema = z.object({
  type: z.enum(["error", "warning", "info"]),
  title: z.string(),
  description: z.string(),
  source: z.string().optional(),
});

export const notificationRouter = router({
  // Publish a custom message to SNS
  publishMessage: publicProcedure
    .input(publishMessageSchema)
    .mutation(async ({ input }) => {
      try {
        return await notifications.publishMessage.execute(input);
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to publish message",
        );
      }
    }),

  // Publish an incident alert
  publishIncidentAlert: publicProcedure
    .input(publishIncidentAlertSchema)
    .mutation(async ({ input }) => {
      try {
        return await notifications.publishIncidentAlert.execute(input);
      } catch (error) {
        throw new Error(
          error instanceof Error
            ? error.message
            : "Failed to publish incident alert",
        );
      }
    }),

  // Publish a system alert
  publishSystemAlert: publicProcedure
    .input(publishSystemAlertSchema)
    .mutation(async ({ input }) => {
      try {
        return await notifications.publishSystemAlert.execute(input);
      } catch (error) {
        throw new Error(
          error instanceof Error
            ? error.message
            : "Failed to publish system alert",
        );
      }
    }),

  // Test SNS connection
  testConnection: publicProcedure.mutation(async () => {
    try {
      return await notifications.testConnection.execute();
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "SNS connection test failed",
      );
    }
  }),
});
