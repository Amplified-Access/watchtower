import { TRPCError } from "@trpc/server";
import z from "zod";
import { organizationProcedure, protectedProcedure } from "../middleware";
import { publicProcedure, router } from "../trpc";
import { anonymousReportingRouter } from "./anonymous-reporting";
import { alertSubscriptionsRouter } from "./alert-subscriptions";
import { notificationRouter } from "./notifications";
import { organizationReportingRouter } from "./organization-reporting";
import { organizationApplicationSchema } from "@/features/organization-registration/schemas/organization-registration-scema";
import { createOrganizationRegistrationUseCases } from "@/features/organization-registration";
import {
  createWatcherUseCases,
  WatcherForbiddenError,
  WatcherNotFoundError,
  WatcherValidationError,
} from "@/features/watcher";

const organizationRegistration = createOrganizationRegistrationUseCases();
const watcherFeature = createWatcherUseCases();

export const coreRouter = router({
  healthCheck: publicProcedure.query(() => {
    return { data: "OK" };
  }),

  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),

  submitOrganizationApplication: publicProcedure
    .input(organizationApplicationSchema)
    .mutation(async (opts) => {
      const { input } = opts;
      try {
        return await organizationRegistration.submitOrganizationApplication.execute(
          input,
        );
      } catch (error) {
        console.error("Error inserting organization application:", error);
        return {
          success: false,
          message: "Failed to submit organization application.",
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),

  getAllOrganizatons: publicProcedure.query(async () => {
    try {
      return await organizationRegistration.getAllOrganizations.execute();
    } catch (error) {
      console.error("Error fetching organizations: ", error);
      return {
        success: false,
        message: "Failed to fetch organizations.",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }),

  submitIncident: protectedProcedure
    .input(
      z.object({
        formId: z.string(),
        data: z.record(z.string(), z.any()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await watcherFeature.submitIncident.execute({
          formId: input.formId,
          data: input.data,
          actor: {
            userId: ctx.user.id,
            role: ctx.user.role ?? "",
            organizationId: ctx.user.organizationId,
          },
        });
      } catch (error) {
        if (error instanceof WatcherNotFoundError) {
          throw new TRPCError({ code: "NOT_FOUND", message: error.message });
        }
        if (error instanceof WatcherValidationError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        if (error instanceof WatcherForbiddenError) {
          throw new TRPCError({ code: "FORBIDDEN", message: error.message });
        }
        console.error("Failed to submit incident:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit incident report",
        });
      }
    }),

  getActiveFormsForWatcher: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await watcherFeature.getActiveFormsForWatcher.execute({
        userId: ctx.user.id,
        role: ctx.user.role ?? "",
        organizationId: ctx.user.organizationId,
      });
    } catch (error) {
      if (error instanceof WatcherValidationError) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      }
      console.error("Failed to fetch active forms:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch active forms",
      });
    }
  }),

  anonymousReports: anonymousReportingRouter,
  organizationReports: organizationReportingRouter,
  notifications: notificationRouter,
  alertSubscriptions: alertSubscriptionsRouter,
});
