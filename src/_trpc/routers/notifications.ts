import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { snsService } from "@/lib/aws/sns";

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
        const result = await snsService.publishMessage(input);

        if (!result.success) {
          throw new Error(result.error || "Failed to publish message");
        }

        return {
          success: true,
          messageId: result.messageId,
          message: "Message published successfully to watchtower-alerts-topic",
        };
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to publish message"
        );
      }
    }),

  // Publish an incident alert
  publishIncidentAlert: publicProcedure
    .input(publishIncidentAlertSchema)
    .mutation(async ({ input }) => {
      try {
        const result = await snsService.publishIncidentAlert(input);

        if (!result.success) {
          throw new Error(result.error || "Failed to publish incident alert");
        }

        return {
          success: true,
          messageId: result.messageId,
          message: "Incident alert published successfully",
        };
      } catch (error) {
        throw new Error(
          error instanceof Error
            ? error.message
            : "Failed to publish incident alert"
        );
      }
    }),

  // Publish a system alert
  publishSystemAlert: publicProcedure
    .input(publishSystemAlertSchema)
    .mutation(async ({ input }) => {
      try {
        const result = await snsService.publishSystemAlert(input);

        if (!result.success) {
          throw new Error(result.error || "Failed to publish system alert");
        }

        return {
          success: true,
          messageId: result.messageId,
          message: "System alert published successfully",
        };
      } catch (error) {
        throw new Error(
          error instanceof Error
            ? error.message
            : "Failed to publish system alert"
        );
      }
    }),

  // Test SNS connection
  testConnection: publicProcedure.mutation(async () => {
    try {
      const result = await snsService.publishMessage({
        message: "Test message from Watchtower application",
        subject: "SNS Connection Test",
        attributes: {
          test: "true",
          source: "watchtower-trpc",
        },
      });

      if (!result.success) {
        throw new Error(result.error || "SNS connection test failed");
      }

      return {
        success: true,
        messageId: result.messageId,
        message: "SNS connection test successful",
      };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "SNS connection test failed"
      );
    }
  }),
});
