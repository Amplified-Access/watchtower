import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../trpc";
import {
  adminProcedure,
  organizationProcedure,
  protectedProcedure,
} from "../middleware";
import { watcherIvitationSchema } from "@/features/admin/schemas/watcher-invitation";
import { formDefinitionSchema } from "@/features/admin/schemas/form-definition";
import {
  createAdminUserManagementUseCases,
  AdminConflictError,
  AdminForbiddenError,
  AdminNotFoundError,
  AdminValidationError,
} from "@/features/admin";
import {
  createWatcherUseCases,
  WatcherForbiddenError,
  WatcherNotFoundError,
  WatcherValidationError,
} from "@/features/watcher";

const adminUserManagement = createAdminUserManagementUseCases();
const watcherFeature = createWatcherUseCases();

export const adminRouter = router({
  saveFormDefinition: publicProcedure
    .input(formDefinitionSchema)
    .mutation(async ({ input }) => {
      try {
        return await adminUserManagement.saveFormDefinition.execute(input);
      } catch (error) {
        console.error("Error saving form schema: ", error);
        return { success: false, message: "Failed to save form definition" };
      }
    }),

  getOrganizationWatchers: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await adminUserManagement.getOrganizationWatchers.execute({
        userId: ctx.user.id,
        role: ctx.user.role ?? "",
        organizationId: ctx.user.organizationId,
      });
    } catch (error) {
      if (error instanceof AdminValidationError) {
        throw new TRPCError({ code: "FORBIDDEN", message: error.message });
      }
      console.error("Error fetching organization watchers: ", error);
      return {
        success: false,
        message: "Failed to fetch organization watchers.",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }),

  getAdminOrganization: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        return await watcherFeature.getAdminOrganization.execute({
          userId: input.userId,
          actor: {
            userId: ctx.user.id,
            role: ctx.user.role ?? "",
            organizationId: ctx.user.organizationId,
          },
        });
      } catch (error) {
        if (error instanceof WatcherForbiddenError) {
          throw new TRPCError({ code: "FORBIDDEN", message: error.message });
        }
        console.error("Error fetching admin organization: ", error);
        return {
          success: false,
          message: "Failed to fetch admins' organization.",
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),

  inviteWatcher: adminProcedure
    .input(watcherIvitationSchema)
    .mutation(async (opts) => {
      const { input } = opts;
      try {
        return await adminUserManagement.inviteWatcher.execute(input);
      } catch (error) {
        if (error instanceof AdminValidationError) {
          return { success: false, message: error.message, error: error.message };
        }
        console.error("Error inviting watcher:", error);
        return {
          success: false,
          message: "Failed to invite watcher.",
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),

  resetUserPassword: adminProcedure
    .input(z.object({ userId: z.string(), email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      try {
        return await adminUserManagement.resetUserPassword.execute({
          userId: input.userId,
          email: input.email,
          actor: {
            userId: ctx.user.id,
            role: ctx.user.role ?? "",
            organizationId: ctx.user.organizationId,
          },
        });
      } catch (error) {
        if (error instanceof AdminNotFoundError) {
          throw new TRPCError({ code: "NOT_FOUND", message: error.message });
        }
        if (error instanceof AdminForbiddenError) {
          throw new TRPCError({ code: "FORBIDDEN", message: error.message });
        }
        console.error("Error resetting user password:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send password reset email",
        });
      }
    }),

  getOrganizationIncidentTypes: organizationProcedure.query(async ({ ctx }) => {
    try {
      return await adminUserManagement.getOrganizationIncidentTypes.execute({
        userId: ctx.user.id,
        role: ctx.user.role ?? "",
        organizationId: ctx.user.organizationId,
      });
    } catch (error) {
      console.error("Error fetching organization incident types:", error);
      if (error instanceof AdminValidationError) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch organization incident types",
      });
    }
  }),

  getAvailableIncidentTypes: organizationProcedure.query(async ({ ctx }) => {
    try {
      return await adminUserManagement.getAvailableIncidentTypes.execute({
        userId: ctx.user.id,
        role: ctx.user.role ?? "",
        organizationId: ctx.user.organizationId,
      });
    } catch (error) {
      console.error("Error fetching available incident types:", error);
      if (error instanceof AdminValidationError) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch available incident types",
      });
    }
  }),

  enableIncidentTypeForOrganization: organizationProcedure
    .input(z.object({ incidentTypeId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        return await adminUserManagement.enableIncidentTypeForOrganization.execute(
          {
            incidentTypeId: input.incidentTypeId,
            actor: {
              userId: ctx.user.id,
              role: ctx.user.role ?? "",
              organizationId: ctx.user.organizationId,
            },
          },
        );
      } catch (error) {
        console.error("Error enabling incident type:", error);
        if (error instanceof AdminValidationError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        if (error instanceof AdminNotFoundError) {
          throw new TRPCError({ code: "NOT_FOUND", message: error.message });
        }
        if (error instanceof AdminConflictError) {
          throw new TRPCError({ code: "CONFLICT", message: error.message });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to enable incident type",
        });
      }
    }),

  createIncidentTypeForOrganization: organizationProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required").max(100, "Name too long"),
        description: z.string().optional(),
        color: z
          .string()
          .regex(/^#[0-9A-F]{6}$/i, "Invalid hex color")
          .default("#ef4444"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await adminUserManagement.createIncidentTypeForOrganization.execute(
          {
            name: input.name,
            description: input.description,
            color: input.color,
            actor: {
              userId: ctx.user.id,
              role: ctx.user.role ?? "",
              organizationId: ctx.user.organizationId,
            },
          },
        );
      } catch (error) {
        console.error("Error creating incident type for organization:", error);
        if (error instanceof AdminValidationError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        if (error instanceof AdminConflictError) {
          throw new TRPCError({ code: "CONFLICT", message: error.message });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create incident type",
        });
      }
    }),

  disableIncidentTypeForOrganization: organizationProcedure
    .input(z.object({ incidentTypeId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        return await adminUserManagement.disableIncidentTypeForOrganization.execute(
          {
            incidentTypeId: input.incidentTypeId,
            actor: {
              userId: ctx.user.id,
              role: ctx.user.role ?? "",
              organizationId: ctx.user.organizationId,
            },
          },
        );
      } catch (error) {
        console.error("Error disabling incident type:", error);
        if (error instanceof AdminValidationError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        if (error instanceof AdminNotFoundError) {
          throw new TRPCError({ code: "NOT_FOUND", message: error.message });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to disable incident type",
        });
      }
    }),

  getAllOrganizationFormsByOrganizationId: organizationProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        return await adminUserManagement.getOrganizationFormsByOrganizationId.execute(
          {
            organizationId: input.organizationId,
            actor: {
              userId: ctx.user.id,
              role: ctx.user.role ?? "",
              organizationId: ctx.user.organizationId,
            },
          },
        );
      } catch (error) {
        if (error instanceof AdminForbiddenError) {
          throw new TRPCError({ code: "FORBIDDEN", message: error.message });
        }
        console.error("Failed to fetch forms for Organization");
        return [];
      }
    }),

  getFormById: organizationProcedure
    .input(z.object({ formId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        return await watcherFeature.getFormById.execute({
          formId: input.formId,
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
        if (error instanceof WatcherForbiddenError) {
          throw new TRPCError({ code: "FORBIDDEN", message: error.message });
        }
        console.error("Failed to fetch form:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch form",
        });
      }
    }),

  updateForm: organizationProcedure
    .input(
      z.object({
        formId: z.string(),
        title: z.string(),
        definition: z.any(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await adminUserManagement.updateForm.execute({
          formId: input.formId,
          title: input.title,
          definition: input.definition,
          isActive: input.isActive,
          actor: {
            userId: ctx.user.id,
            role: ctx.user.role ?? "",
            organizationId: ctx.user.organizationId,
          },
        });
      } catch (error) {
        if (error instanceof AdminNotFoundError) {
          throw new TRPCError({ code: "NOT_FOUND", message: error.message });
        }
        if (error instanceof AdminForbiddenError) {
          throw new TRPCError({ code: "FORBIDDEN", message: error.message });
        }
        console.error("Failed to update form:", error);
        return { success: false, message: "Failed to update form" };
      }
    }),

  deleteForm: organizationProcedure
    .input(z.object({ formId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        return await adminUserManagement.deleteForm.execute({
          formId: input.formId,
          actor: {
            userId: ctx.user.id,
            role: ctx.user.role ?? "",
            organizationId: ctx.user.organizationId,
          },
        });
      } catch (error) {
        if (error instanceof AdminNotFoundError) {
          throw new TRPCError({ code: "NOT_FOUND", message: error.message });
        }
        if (error instanceof AdminForbiddenError) {
          throw new TRPCError({ code: "FORBIDDEN", message: error.message });
        }
        console.error("Failed to delete form:", error);
        return { success: false, message: "Failed to delete form" };
      }
    }),

  getAllOrganizationIncidents: organizationProcedure
    .input(
      z.object({
        organizationId: z.string(),
        search: z.string().optional(),
        status: z
          .enum(["reported", "investigating", "resolved", "closed"])
          .optional(),
        formId: z.string().optional(),
        sortBy: z
          .enum(["createdAt", "updatedAt", "status"])
          .default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        return await adminUserManagement.getAllOrganizationIncidents.execute({
          ...input,
          actor: {
            userId: ctx.user.id,
            role: ctx.user.role ?? "",
            organizationId: ctx.user.organizationId,
          },
        });
      } catch (error) {
        if (error instanceof AdminForbiddenError) {
          throw new TRPCError({ code: "FORBIDDEN", message: error.message });
        }
        console.error("Failed to fetch incidents:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch incidents",
        });
      }
    }),

  getIncidentById: organizationProcedure
    .input(z.object({ incidentId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        return await adminUserManagement.getIncidentById.execute({
          incidentId: input.incidentId,
          actor: {
            userId: ctx.user.id,
            role: ctx.user.role ?? "",
            organizationId: ctx.user.organizationId,
          },
        });
      } catch (error) {
        if (error instanceof AdminNotFoundError) {
          throw new TRPCError({ code: "NOT_FOUND", message: error.message });
        }
        if (error instanceof AdminForbiddenError) {
          throw new TRPCError({ code: "FORBIDDEN", message: error.message });
        }
        console.error("Failed to fetch incident:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch incident",
        });
      }
    }),

  updateIncidentStatus: adminProcedure
    .input(
      z.object({
        incidentId: z.string(),
        status: z.enum(["reported", "investigating", "resolved", "closed"]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await adminUserManagement.updateIncidentStatus.execute({
          incidentId: input.incidentId,
          status: input.status,
          actor: {
            userId: ctx.user.id,
            role: ctx.user.role ?? "",
            organizationId: ctx.user.organizationId,
          },
        });
      } catch (error) {
        if (error instanceof AdminNotFoundError) {
          throw new TRPCError({ code: "NOT_FOUND", message: error.message });
        }
        if (error instanceof AdminForbiddenError) {
          throw new TRPCError({ code: "FORBIDDEN", message: error.message });
        }
        console.error("Failed to update incident:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update incident status",
        });
      }
    }),

  getOrganizationRecentIncidents: organizationProcedure
    .input(z.object({ limit: z.number().default(5) }))
    .query(async ({ input, ctx }) => {
      try {
        return await adminUserManagement.getOrganizationRecentIncidents.execute(
          {
            limit: input.limit,
            actor: {
              userId: ctx.user.id,
              role: ctx.user.role ?? "",
              organizationId: ctx.user.organizationId,
            },
          },
        );
      } catch (error) {
        if (error instanceof AdminValidationError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        console.error("Failed to fetch recent incidents:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch recent incidents",
        });
      }
    }),

  getOrganizationPendingReports: organizationProcedure
    .input(z.object({ limit: z.number().default(5) }))
    .query(async ({ input, ctx }) => {
      try {
        return await adminUserManagement.getOrganizationPendingReports.execute({
          limit: input.limit,
          actor: {
            userId: ctx.user.id,
            role: ctx.user.role ?? "",
            organizationId: ctx.user.organizationId,
          },
        });
      } catch (error) {
        if (error instanceof AdminValidationError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        console.error("Failed to fetch pending reports:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch pending reports",
        });
      }
    }),

  getOrganizationIncidentTypesAnalytics: organizationProcedure.query(
    async ({ ctx }) => {
      try {
        return await adminUserManagement.getOrganizationIncidentTypesAnalytics.execute(
          {
            userId: ctx.user.id,
            role: ctx.user.role ?? "",
            organizationId: ctx.user.organizationId,
          },
        );
      } catch (error) {
        if (error instanceof AdminValidationError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        console.error("Failed to fetch incident types analytics:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch incident types analytics",
        });
      }
    },
  ),

  getOrganizationWeeklyIncidentTrend: organizationProcedure.query(
    async ({ ctx }) => {
      try {
        return await adminUserManagement.getOrganizationWeeklyIncidentTrend.execute(
          {
            userId: ctx.user.id,
            role: ctx.user.role ?? "",
            organizationId: ctx.user.organizationId,
          },
        );
      } catch (error) {
        if (error instanceof AdminValidationError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        console.error("Failed to fetch weekly incident trend:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch weekly incident trend",
        });
      }
    },
  ),

  getOrganizationDashboardStats: organizationProcedure.query(
    async ({ ctx }) => {
      try {
        return await watcherFeature.getOrganizationDashboardStats.execute({
          userId: ctx.user.id,
          role: ctx.user.role ?? "",
          organizationId: ctx.user.organizationId,
        });
      } catch (error) {
        if (error instanceof WatcherValidationError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        console.error("Failed to fetch dashboard stats:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch dashboard stats",
        });
      }
    },
  ),

  getOrganizationRecentActivity: organizationProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input, ctx }) => {
      try {
        const allActivity =
          await watcherFeature.getOrganizationRecentActivity.execute({
            limit: input.limit,
            actor: {
              userId: ctx.user.id,
              role: ctx.user.role ?? "",
              organizationId: ctx.user.organizationId,
            },
          });

        return allActivity.map((item) => ({
          ...item,
          timestamp: formatRelativeTime(item.timestamp),
        }));
      } catch (error) {
        if (error instanceof WatcherValidationError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        console.error("Failed to fetch recent activity:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch recent activity",
        });
      }
    }),
});

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}
