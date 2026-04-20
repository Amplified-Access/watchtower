import { db } from "@/db";
import { publicProcedure, router } from "../trpc";
import {
  superAdminProcedure,
  adminProcedure,
  watcherProcedure,
  organizationProcedure,
  protectedProcedure,
} from "../middleware";
import { organizationApplicationSchema } from "@/features/organization-registration/schemas/organization-registration-scema";
import { organizationApplications } from "@/db/schemas/organization-applications";
import z, { any } from "zod";
import { organizations } from "@/db/schemas/organizations";
import {
  eq,
  and,
  count,
  desc,
  asc,
  like,
  ilike,
  or,
  sql,
  gte,
  lt,
} from "drizzle-orm";
import { auth } from "@/lib/auth";
import { user } from "@/db/schemas/auth";
import { watcherIvitationSchema } from "@/features/admin/schemas/watcher-invitation";
import { TRPCError } from "@trpc/server";
import { authClient } from "@/lib/auth-client";
import { formDefinitionSchema } from "@/features/admin/schemas/form-definition";
import { forms } from "@/db/schemas/forms";
import { incidents } from "@/db/schemas/incidents";
import { reports } from "@/db/schemas/reports";
import {
  insights,
  insightTags,
  insightTagRelations,
} from "@/db/schemas/insights";
import { incidentTypes } from "@/db/schemas/incident-types";
import { organizationIncidentTypes } from "@/db/schemas/organization-incident-types";
import { anonymousReportingRouter } from "./anonymous-reporting";
import { organizationReportingRouter } from "./organization-reporting";
import { notificationRouter } from "./notifications";
import { alertSubscriptionsRouter } from "./alert-subscriptions";
import { datasets } from "@/db/schemas/datasets";
import {
  datasetUploadSchema,
  datasetUpdateSchema,
  datasetFilterSchema,
} from "@/features/datasets/schemas/dataset-schema";
import { createOrganizationRegistrationUseCases } from "@/features/organization-registration";
import { createDatasetsUseCases } from "@/features/datasets";
import {
  createWatcherUseCases,
  WatcherForbiddenError,
  WatcherNotFoundError,
  WatcherValidationError,
} from "@/features/watcher";
import {
  createAdminUserManagementUseCases,
  AdminConflictError,
  AdminForbiddenError,
  AdminNotFoundError,
  AdminValidationError,
} from "@/features/admin";
import {
  createSuperAdminFormUseCases,
  SuperAdminFormNotFoundError,
  SuperAdminFormValidationError,
} from "@/features/super-admin";

const organizationRegistration = createOrganizationRegistrationUseCases();
const datasetsFeature = createDatasetsUseCases();
const watcherFeature = createWatcherUseCases();
const adminUserManagement = createAdminUserManagementUseCases();
const superAdminForms = createSuperAdminFormUseCases();

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return { data: "OK" };
  }),

  /**
   * Get current user with all fields including organizationId
   */
  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),

  /**
   * Get all applications from all organizations - SUPER ADMIN ONLY
   */
  getAllOrganizatonApplications: superAdminProcedure.query(async () => {
    try {
      return await organizationRegistration.getAllOrganizationApplications.execute();
    } catch (error) {
      console.error("Error fetching all applications: ", error);
      return {
        success: false,
        message: "Failed to fetch applications.",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }),

  /**
   * Submitting an organization's application
   */
  submitOrganizationApplication: publicProcedure
    .input(organizationApplicationSchema)
    .mutation(async (opts) => {
      const { input } = opts; // Access the validated input data

      console.log("Received organization application:", input);

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

  /**
   * Declining an organization's application - SUPER ADMIN ONLY
   */
  declineOrganizationApplication: superAdminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { id } = input;
      try {
        return await organizationRegistration.declineOrganizationApplication.execute(
          id,
        );
      } catch (error) {
        console.error("Error declining application : ", error);
        return {
          success: false,
          message: "Failed to decline organizations.",
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),

  /**
   * Saving a form definition to the database
   */
  saveFormDefinition: publicProcedure
    .input(formDefinitionSchema)
    .mutation(async (opts) => {
      const { input } = opts;

      try {
        return await adminUserManagement.saveFormDefinition.execute(input);
      } catch (error) {
        console.error("Error saving form schema: ", error);
        return {
          success: false,
          message: "Failed to save form definition",
        };
      }
    }),

  /**
   * Approving an application from an organization - SUPER ADMIN ONLY
   */
  approveOrganizationApplication: superAdminProcedure

    .input(z.object({ id: z.number() }))

    .mutation(async ({ input }) => {
      const { id } = input;

      try {
        return await organizationRegistration.approveOrganizationApplication.execute(
          id,
        );
      } catch (error) {
        console.error("Error approving application:", error);

        return {
          success: false,

          message: "Failed to approve application.",

          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),

  /**
   * Fetching all organizations from the database
   */
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

  /**
   * Fetch all admins from the database - SUPER ADMIN ONLY
   */
  getAllAdmins: superAdminProcedure.query(async () => {
    try {
      return await superAdminForms.getAllAdminsForSuperAdmin.execute();
    } catch (error) {
      console.error("Error fetching admins: ", error);
      return {
        success: false,
        message: "Failed to fetch admins.",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }),

  /**
   * Fetch all watchers from the database - SUPER ADMIN ONLY
   */
  getAllWatchers: superAdminProcedure.query(async () => {
    try {
      return await superAdminForms.getAllWatchersForSuperAdmin.execute();
    } catch (error) {
      console.error("Error fetching watchers: ", error);
      return {
        success: false,
        message: "Failed to fetch watchers.",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }),

  /**
   * Get all incidents across all organizations - SUPER ADMIN ONLY
   */
  getAllIncidentsForSuperAdmin: superAdminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z
          .enum(["reported", "investigating", "resolved", "closed"])
          .optional(),
        organizationId: z.string().optional(),
        formId: z.string().optional(),
        sortBy: z
          .enum(["createdAt", "updatedAt", "status"])
          .default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ input }) => {
      try {
        return await superAdminForms.getAllIncidentsForSuperAdmin.execute(
          input,
        );
      } catch (error) {
        if (error instanceof SuperAdminFormValidationError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        console.error("Failed to retrieve incidents:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve incidents",
        });
      }
    }),

  /**
   * Get incident by ID for super admin - can access any incident
   */
  getIncidentByIdForSuperAdmin: superAdminProcedure
    .input(z.object({ incidentId: z.string() }))
    .query(async ({ input }) => {
      try {
        return await superAdminForms.getIncidentByIdForSuperAdmin.execute(
          input.incidentId,
        );
      } catch (error) {
        if (error instanceof SuperAdminFormNotFoundError) {
          throw new TRPCError({ code: "NOT_FOUND", message: error.message });
        }
        console.error("Failed to fetch incident:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch incident",
        });
      }
    }),

  /**
   * Update incident status for super admin - can update any incident
   */
  updateIncidentStatusForSuperAdmin: superAdminProcedure
    .input(
      z.object({
        incidentId: z.string(),
        status: z.enum(["reported", "investigating", "resolved", "closed"]),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        return await superAdminForms.updateIncidentStatusForSuperAdmin.execute(
          input,
        );
      } catch (error) {
        if (error instanceof SuperAdminFormNotFoundError) {
          throw new TRPCError({ code: "NOT_FOUND", message: error.message });
        }
        if (error instanceof SuperAdminFormValidationError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        console.error("Failed to update incident:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update incident status",
        });
      }
    }),

  /**
   * Delete incident for super admin - can delete any incident
   */
  deleteIncidentForSuperAdmin: superAdminProcedure
    .input(z.object({ incidentId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        return await superAdminForms.deleteIncidentForSuperAdmin.execute(
          input.incidentId,
        );
      } catch (error) {
        if (error instanceof SuperAdminFormNotFoundError) {
          throw new TRPCError({ code: "NOT_FOUND", message: error.message });
        }
        console.error("Failed to delete incident:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete incident",
        });
      }
    }),

  /**
   * Get watchers for the current user's organization - PROTECTED
   */
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

  /**
   * Get an admin's organization by their user ID - PROTECTED
   */
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
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        console.error("Error fetching admin organization: ", error);
        return {
          success: false,
          message: "Failed to fetch admins' organization.",
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),

  /**
   * An admin inviting a watcher to the watchtower - ADMIN ONLY
   */
  inviteWatcher: adminProcedure
    .input(watcherIvitationSchema)
    .mutation(async (opts) => {
      const { input } = opts;
      try {
        return await adminUserManagement.inviteWatcher.execute(input);
      } catch (error) {
        if (error instanceof AdminValidationError) {
          return {
            success: false,
            message: error.message,
            error: error.message,
          };
        }
        console.error("Error inviting watcher:", error);
        return {
          success: false,
          message: "Failed to invite watcher.",
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),

  /**
   * Reset user password - ADMIN+ ONLY
   */
  resetUserPassword: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        email: z.string().email(),
      }),
    )
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

  /**
   * Get organization's incident types - ADMIN+ ONLY
   */
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

  /**
   * Get available incident types for organization to enable - ADMIN+ ONLY
   */
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

  /**
   * Enable existing incident type for organization - ADMIN+ ONLY
   */
  enableIncidentTypeForOrganization: organizationProcedure
    .input(z.object({ incidentTypeId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        return await adminUserManagement.enableIncidentTypeForOrganization.execute({
          incidentTypeId: input.incidentTypeId,
          actor: {
            userId: ctx.user.id,
            role: ctx.user.role ?? "",
            organizationId: ctx.user.organizationId,
          },
        });
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

  /**
   * Create new incident type for organization - ADMIN+ ONLY
   */
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
        return await adminUserManagement.createIncidentTypeForOrganization.execute({
          name: input.name,
          description: input.description,
          color: input.color,
          actor: {
            userId: ctx.user.id,
            role: ctx.user.role ?? "",
            organizationId: ctx.user.organizationId,
          },
        });
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

  /**
   * Disable incident type for organization - ADMIN+ ONLY
   */
  disableIncidentTypeForOrganization: organizationProcedure
    .input(z.object({ incidentTypeId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        return await adminUserManagement.disableIncidentTypeForOrganization.execute({
          incidentTypeId: input.incidentTypeId,
          actor: {
            userId: ctx.user.id,
            role: ctx.user.role ?? "",
            organizationId: ctx.user.organizationId,
          },
        });
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
    .input(
      z.object({
        organizationId: z.string(),
      }),
    )
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
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        console.error("Failed to fetch forms for Organization");
        return [];
      }
    }),

  /**
   * Get a single form by ID - ORGANIZATION SCOPED
   */
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
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        if (error instanceof WatcherForbiddenError) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        console.error("Failed to fetch form:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch form",
        });
      }
    }),

  /**
   * Update form definition - ORGANIZATION SCOPED
   */
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
        return {
          success: false,
          message: "Failed to update form",
        };
      }
    }),

  /**
   * Get active forms for watchers - only returns active forms
   */
  getActiveFormsForWatcher: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await watcherFeature.getActiveFormsForWatcher.execute({
        userId: ctx.user.id,
        role: ctx.user.role ?? "",
        organizationId: ctx.user.organizationId,
      });
    } catch (error) {
      if (error instanceof WatcherValidationError) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.message,
        });
      }
      console.error("Failed to fetch active forms:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch active forms",
      });
    }
  }),

  /**
   * Delete form - ORGANIZATION SCOPED
   */
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
        return {
          success: false,
          message: "Failed to delete form",
        };
      }
    }),

  /**
   * Get all incidents for an organization with search and filter
   */
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
          organizationId: input.organizationId,
          sortBy: input.sortBy,
          sortOrder: input.sortOrder,
          limit: input.limit,
          offset: input.offset,
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

  /**
   * Get incident by ID - ORGANIZATION SCOPED
   */
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

  /**
   * Update incident status - ADMIN+ ONLY
   */
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

  /**
   * Submit an incident report - Watchers and Admins only
   */
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
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
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

  /**
   * Get all forms across all organizations - SUPER ADMIN ONLY
   */
  getAllFormsForSuperAdmin: superAdminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        organizationId: z.string().optional(),
        isActive: z.boolean().optional(),
        sortBy: z.enum(["createdAt", "updatedAt", "name"]).default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ input }) => {
      try {
        return await superAdminForms.getAllFormsForSuperAdmin.execute(input);
      } catch (error) {
        console.error("Failed to retrieve forms:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve forms",
        });
      }
    }),

  /**
   * Get form by ID for super admin - can access any form
   */
  getFormByIdForSuperAdmin: superAdminProcedure
    .input(z.object({ formId: z.string() }))
    .query(async ({ input }) => {
      try {
        return await superAdminForms.getFormByIdForSuperAdmin.execute(
          input.formId,
        );
      } catch (error) {
        if (error instanceof SuperAdminFormNotFoundError) {
          throw new TRPCError({ code: "NOT_FOUND", message: error.message });
        }
        console.error("Failed to fetch form:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch form",
        });
      }
    }),

  /**
   * Update form for super admin - can update any form
   */
  updateFormForSuperAdmin: superAdminProcedure
    .input(
      z.object({
        formId: z.string(),
        name: z.string().optional(),
        definition: z.any().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        return await superAdminForms.updateFormForSuperAdmin.execute(input);
      } catch (error) {
        if (error instanceof SuperAdminFormNotFoundError) {
          throw new TRPCError({ code: "NOT_FOUND", message: error.message });
        }
        console.error("Failed to update form:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update form",
        });
      }
    }),

  /**
   * Delete form for super admin - can delete any form
   */
  deleteFormForSuperAdmin: superAdminProcedure
    .input(z.object({ formId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        return await superAdminForms.deleteFormForSuperAdmin.execute(
          input.formId,
        );
      } catch (error) {
        if (error instanceof SuperAdminFormNotFoundError) {
          throw new TRPCError({ code: "NOT_FOUND", message: error.message });
        }
        if (error instanceof SuperAdminFormValidationError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }
        console.error("Failed to delete form:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete form",
        });
      }
    }),

  /**
   * Create a new report - ORGANIZATION SCOPED
   */
  createReport: organizationProcedure
    .input(
      z.object({
        title: z.string().min(1, "Title is required"),
        fileKey: z.string().min(1, "File key is required"),
        status: z.enum(["draft", "published"]).default("draft"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { title, fileKey, status } = input;

      try {
        const userWithOrg = ctx.user as typeof ctx.user & {
          organizationId?: string;
        };

        if (!userWithOrg.organizationId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "User must be associated with an organization",
          });
        }

        const [newReport] = await db
          .insert(reports)
          .values({
            organizationId: userWithOrg.organizationId,
            reportedById: ctx.user.id,
            title,
            fileKey,
            status,
          })
          .returning();

        return {
          success: true,
          message: "Report created successfully",
          reportId: newReport.id,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Failed to create report:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create report",
        });
      }
    }),

  /**
   * Get all reports for an organization - ORGANIZATION SCOPED
   */
  getOrganizationReports: organizationProcedure
    .input(
      z.object({
        organizationId: z.string(),
        status: z.enum(["draft", "published", "all"]).default("all"),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { organizationId, status, limit, offset } = input;

      // Users can only access reports from their own organization unless they're super admin
      if (ctx.user.role !== "super-admin") {
        const userWithOrg = ctx.user as typeof ctx.user & {
          organizationId?: string;
        };
        if (userWithOrg.organizationId !== organizationId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only access reports from your own organization",
          });
        }
      }

      try {
        // Build where conditions
        const whereConditions = [eq(reports.organizationId, organizationId)];

        if (status !== "all") {
          whereConditions.push(eq(reports.status, status));
        }

        // Get reports with user details
        const data = await db
          .select({
            id: reports.id,
            organizationId: reports.organizationId,
            reportedById: reports.reportedById,
            title: reports.title,
            fileKey: reports.fileKey,
            status: reports.status,
            createdAt: reports.createdAt,
            updatedAt: reports.updatedAt,
            authorName: user.name,
            authorEmail: user.email,
          })
          .from(reports)
          .leftJoin(user, eq(reports.reportedById, user.id))
          .where(and(...whereConditions))
          .orderBy(desc(reports.updatedAt))
          .limit(limit)
          .offset(offset);

        // Get total count
        const totalCountResult = await db
          .select({ count: count() })
          .from(reports)
          .where(and(...whereConditions));

        const totalCount = totalCountResult[0]?.count || 0;

        return {
          reports: data,
          totalCount,
          hasMore: offset + data.length < totalCount,
        };
      } catch (error) {
        console.error("Failed to fetch reports:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch reports",
        });
      }
    }),

  /**
   * Get all reports across all organizations - SUPER ADMIN ONLY
   */
  getAllReportsForSuperAdmin: superAdminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        organizationId: z.string().optional(),
        status: z.enum(["draft", "published", "all"]).default("all"),
        sortBy: z
          .enum(["createdAt", "updatedAt", "title"])
          .default("updatedAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ input }) => {
      try {
        return await superAdminForms.getAllReportsForSuperAdmin.execute(input);
      } catch (error) {
        if (error instanceof SuperAdminFormValidationError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        console.error("Failed to retrieve reports:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve reports",
        });
      }
    }),

  /**
   * Get report by ID - ORGANIZATION SCOPED
   */
  getReportById: organizationProcedure
    .input(z.object({ reportId: z.string() }))
    .query(async ({ input, ctx }) => {
      const { reportId } = input;

      try {
        const [report] = await db
          .select({
            id: reports.id,
            organizationId: reports.organizationId,
            reportedById: reports.reportedById,
            title: reports.title,
            fileKey: reports.fileKey,
            status: reports.status,
            createdAt: reports.createdAt,
            updatedAt: reports.updatedAt,
            authorName: user.name,
            authorEmail: user.email,
            organizationName: organizations.name,
          })
          .from(reports)
          .leftJoin(user, eq(reports.reportedById, user.id))
          .leftJoin(organizations, eq(reports.organizationId, organizations.id))
          .where(eq(reports.id, reportId))
          .limit(1);

        if (!report) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Report not found",
          });
        }

        // Check if user has access to this report's organization
        if (ctx.user.role !== "super-admin") {
          const userWithOrg = ctx.user as typeof ctx.user & {
            organizationId?: string;
          };
          if (userWithOrg.organizationId !== report.organizationId) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You can only access reports from your own organization",
            });
          }
        }

        return report;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Failed to fetch report:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch report",
        });
      }
    }),

  /**
   * Update report - ORGANIZATION SCOPED
   */
  updateReport: organizationProcedure
    .input(
      z.object({
        reportId: z.string(),
        title: z.string().optional(),
        status: z.enum(["draft", "published"]).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { reportId, title, status } = input;

      try {
        // First check if report exists and user has access
        const [existingReport] = await db
          .select()
          .from(reports)
          .where(eq(reports.id, reportId))
          .limit(1);

        if (!existingReport) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Report not found",
          });
        }

        // Check if user has access to this report's organization
        if (ctx.user.role !== "super-admin") {
          const userWithOrg = ctx.user as typeof ctx.user & {
            organizationId?: string;
          };
          if (userWithOrg.organizationId !== existingReport.organizationId) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You can only update reports from your own organization",
            });
          }
        }

        // Prepare update data
        const updateData: any = {
          updatedAt: new Date(),
        };

        if (title !== undefined) {
          updateData.title = title;
        }
        if (status !== undefined) {
          updateData.status = status;
        }

        // Update the report
        await db
          .update(reports)
          .set(updateData)
          .where(eq(reports.id, reportId));

        return {
          success: true,
          message: "Report updated successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Failed to update report:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update report",
        });
      }
    }),

  /**
   * Delete report - ORGANIZATION SCOPED
   */
  deleteReport: organizationProcedure
    .input(z.object({ reportId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { reportId } = input;

      try {
        // First check if report exists and user has access
        const [existingReport] = await db
          .select()
          .from(reports)
          .where(eq(reports.id, reportId))
          .limit(1);

        if (!existingReport) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Report not found",
          });
        }

        // Check if user has access to this report's organization
        if (ctx.user.role !== "super-admin") {
          const userWithOrg = ctx.user as typeof ctx.user & {
            organizationId?: string;
          };
          if (userWithOrg.organizationId !== existingReport.organizationId) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You can only delete reports from your own organization",
            });
          }
        }

        // Delete the report
        await db.delete(reports).where(eq(reports.id, reportId));

        return {
          success: true,
          message: "Report deleted successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Failed to delete report:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete report",
        });
      }
    }),

  /**
   * Get all published reports - PUBLIC ACCESS
   */
  getPublicReports: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        search: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const { limit, offset, search } = input;

      try {
        // Build where conditions
        const whereConditions = [eq(reports.status, "published")];

        if (search) {
          whereConditions.push(ilike(reports.title, `%${search}%`));
        }

        const allReports = await db
          .select({
            id: reports.id,
            title: reports.title,
            fileKey: reports.fileKey,
            createdAt: reports.createdAt,
            updatedAt: reports.updatedAt,
            authorName: user.name,
            organizationName: organizations.name,
            organizationSlug: organizations.slug,
          })
          .from(reports)
          .leftJoin(user, eq(reports.reportedById, user.id))
          .leftJoin(organizations, eq(reports.organizationId, organizations.id))
          .where(and(...whereConditions))
          .orderBy(desc(reports.updatedAt))
          .limit(limit)
          .offset(offset);

        return allReports;
      } catch (error) {
        console.error("Failed to fetch public reports:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch reports",
        });
      }
    }),

  /**
   * Get a specific published report by ID - PUBLIC ACCESS
   */
  getPublicReportById: publicProcedure
    .input(z.object({ reportId: z.string() }))
    .query(async ({ input }) => {
      const { reportId } = input;

      try {
        const [report] = await db
          .select({
            id: reports.id,
            title: reports.title,
            fileKey: reports.fileKey,
            status: reports.status,
            createdAt: reports.createdAt,
            updatedAt: reports.updatedAt,
            authorName: user.name,
            authorEmail: user.email,
            organizationName: organizations.name,
          })
          .from(reports)
          .leftJoin(user, eq(reports.reportedById, user.id))
          .leftJoin(organizations, eq(reports.organizationId, organizations.id))
          .where(and(eq(reports.id, reportId), eq(reports.status, "published")))
          .limit(1);

        if (!report) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Report not found",
          });
        }

        return report;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Failed to fetch public report:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch report",
        });
      }
    }),

  /**
   * Get all published insights - PUBLIC ACCESS
   */
  getPublicInsights: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        search: z.string().optional(),
        tagId: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const { limit, offset, search, tagId } = input;

      try {
        // Build where conditions
        const whereConditions = [eq(insights.status, "published")];

        if (search) {
          whereConditions.push(ilike(insights.title, `%${search}%`));
        }

        let query = db
          .select({
            id: insights.id,
            title: insights.title,
            slug: insights.slug,
            description: insights.description,
            imageUrl: insights.imageUrl,
            imageAlt: insights.imageAlt,
            publishedAt: insights.publishedAt,
            createdAt: insights.createdAt,
            authorName: user.name,
            organizationName: organizations.name,
          })
          .from(insights)
          .leftJoin(user, eq(insights.authorId, user.id))
          .leftJoin(
            organizations,
            eq(insights.organizationId, organizations.id),
          )
          .where(and(...whereConditions))
          .orderBy(desc(insights.publishedAt))
          .limit(limit)
          .offset(offset);

        // If filtering by tag, join with tag relations
        if (tagId) {
          query = db
            .select({
              id: insights.id,
              title: insights.title,
              slug: insights.slug,
              description: insights.description,
              imageUrl: insights.imageUrl,
              imageAlt: insights.imageAlt,
              publishedAt: insights.publishedAt,
              createdAt: insights.createdAt,
              authorName: user.name,
              organizationName: organizations.name,
            })
            .from(insights)
            .leftJoin(user, eq(insights.authorId, user.id))
            .leftJoin(
              organizations,
              eq(insights.organizationId, organizations.id),
            )
            .innerJoin(
              insightTagRelations,
              eq(insights.id, insightTagRelations.insightId),
            )
            .where(
              and(...whereConditions, eq(insightTagRelations.tagId, tagId)),
            )
            .orderBy(desc(insights.publishedAt))
            .limit(limit)
            .offset(offset);
        }

        const allInsights = await query;

        return allInsights;
      } catch (error) {
        console.error("Failed to fetch public insights:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch insights",
        });
      }
    }),

  /**
   * Get a specific published insight by slug - PUBLIC ACCESS
   */
  getPublicInsightBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const { slug } = input;

      try {
        const [insight] = await db
          .select({
            id: insights.id,
            title: insights.title,
            slug: insights.slug,
            description: insights.description,
            content: insights.content,
            imageUrl: insights.imageUrl,
            imageAlt: insights.imageAlt,
            publishedAt: insights.publishedAt,
            createdAt: insights.createdAt,
            authorName: user.name,
            authorEmail: user.email,
            organizationName: organizations.name,
          })
          .from(insights)
          .leftJoin(user, eq(insights.authorId, user.id))
          .leftJoin(
            organizations,
            eq(insights.organizationId, organizations.id),
          )
          .where(and(eq(insights.slug, slug), eq(insights.status, "published")))
          .limit(1);

        if (!insight) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Insight not found",
          });
        }

        // Get tags for this insight
        const tags = await db
          .select({
            id: insightTags.id,
            title: insightTags.title,
            slug: insightTags.slug,
          })
          .from(insightTags)
          .innerJoin(
            insightTagRelations,
            eq(insightTags.id, insightTagRelations.tagId),
          )
          .where(eq(insightTagRelations.insightId, insight.id));

        return {
          ...insight,
          tags,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Failed to fetch public insight:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch insight",
        });
      }
    }),

  /**
   * Get all insight tags - PUBLIC ACCESS
   */
  getInsightTags: publicProcedure.query(async () => {
    try {
      const tags = await db
        .select({
          id: insightTags.id,
          title: insightTags.title,
          slug: insightTags.slug,
        })
        .from(insightTags)
        .orderBy(insightTags.title);

      return tags;
    } catch (error) {
      console.error("Failed to fetch insight tags:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch tags",
      });
    }
  }),

  /**
   * Create insight - ORGANIZATION SCOPED
   */
  createInsight: organizationProcedure
    .input(
      z.object({
        title: z.string().min(1, "Title is required"),
        slug: z.string().min(1, "Slug is required"),
        description: z.string().min(1, "Description is required"),
        content: z.any().optional(),
        imageUrl: z.string().optional(),
        imageAlt: z.string().optional(),
        tagIds: z.array(z.string()).default([]),
        status: z.enum(["draft", "published"]).default("draft"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const {
        title,
        slug,
        description,
        content,
        imageUrl,
        imageAlt,
        tagIds,
        status,
      } = input;

      try {
        const userWithOrg = ctx.user as typeof ctx.user & {
          organizationId?: string;
        };

        const [newInsight] = await db
          .insert(insights)
          .values({
            title,
            slug,
            description,
            content,
            imageUrl,
            imageAlt,
            authorId: ctx.user.id,
            organizationId: userWithOrg.organizationId,
            status,
            publishedAt: status === "published" ? new Date() : null,
          })
          .returning();

        // Add tag relations
        if (tagIds.length > 0) {
          await db.insert(insightTagRelations).values(
            tagIds.map((tagId) => ({
              insightId: newInsight.id,
              tagId,
            })),
          );
        }

        return {
          success: true,
          message: "Insight created successfully",
          insightId: newInsight.id,
        };
      } catch (error) {
        console.error("Failed to create insight:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create insight",
        });
      }
    }),

  /**
   * Get all organizations with search and filter capabilities - PUBLIC
   */
  getPublicOrganizations: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        limit: z.number().min(1).max(50).default(12),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ input }) => {
      try {
        const { search, limit, offset } = input;

        // Build where conditions
        const whereConditions = [];

        if (search) {
          whereConditions.push(ilike(organizations.name, `%${search}%`));
        }

        // Main query
        const baseSelect = db
          .select({
            id: organizations.id,
            name: organizations.name,
            slug: organizations.slug,
            description: organizations.description,
            website: organizations.website,
            location: organizations.location,
            contactEmail: organizations.contactEmail,
            createdAt: organizations.createdAt,
          })
          .from(organizations);

        const result =
          whereConditions.length > 0
            ? await baseSelect
                .where(
                  whereConditions.length === 1
                    ? whereConditions[0]
                    : and(...whereConditions),
                )
                .orderBy(desc(organizations.createdAt))
                .limit(limit)
                .offset(offset)
            : await baseSelect
                .orderBy(desc(organizations.createdAt))
                .limit(limit)
                .offset(offset);

        // Count query
        const baseCount = db.select({ count: count() }).from(organizations);

        const [{ count: total }] =
          whereConditions.length > 0
            ? await baseCount.where(
                whereConditions.length === 1
                  ? whereConditions[0]
                  : and(...whereConditions),
              )
            : await baseCount;

        return {
          organizations: result,
          total,
          hasMore: offset + limit < total,
        };
      } catch (error) {
        console.error("Error fetching organizations:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch organizations",
        });
      }
    }),

  /**
   * Get organization by slug - PUBLIC
   */
  getOrganizationBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      try {
        const [organization] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.slug, input.slug))
          .limit(1);

        if (!organization) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Organization not found",
          });
        }

        return organization;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error fetching organization:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch organization",
        });
      }
    }),

  // =============================================================================
  // DATASETS PROCEDURES
  // =============================================================================

  /**
   * Get all public datasets with filtering and pagination
   */
  getPublicDatasets: publicProcedure
    .input(datasetFilterSchema)
    .query(async ({ input }) => {
      try {
        return await datasetsFeature.getPublicDatasets.execute({
          ...input,
          page: input.page,
          limit: input.limit,
        });
      } catch (error) {
        console.error("Error fetching public datasets:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch datasets",
        });
      }
    }),

  /**
   * Get a single dataset by ID
   */
  getDatasetById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      try {
        const dataset = await datasetsFeature.getDatasetById.execute(input.id);

        if (!dataset) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Dataset not found",
          });
        }

        return dataset;
      } catch (error) {
        console.error("Error fetching dataset:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch dataset",
        });
      }
    }),

  /**
   * Increment download count for a dataset
   */
  incrementDatasetDownload: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      try {
        return await datasetsFeature.incrementDatasetDownload.execute(input.id);
      } catch (error) {
        console.error("Error incrementing download count:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update download count",
        });
      }
    }),

  /**
   * Upload a new dataset - SUPER ADMIN ONLY
   */
  uploadDataset: superAdminProcedure
    .input(
      datasetUploadSchema.extend({
        fileKey: z.string(),
        fileName: z.string(),
        fileSize: z.number(),
        fileType: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        return await datasetsFeature.uploadDataset.execute(input);
      } catch (error) {
        console.error("Error uploading dataset:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload dataset",
        });
      }
    }),

  /**
   * Get all datasets for admin management - SUPER ADMIN ONLY
   */
  getAllDatasets: superAdminProcedure
    .input(
      datasetFilterSchema.extend({
        includePrivate: z.boolean().optional().default(true),
      }),
    )
    .query(async ({ input }) => {
      try {
        return await datasetsFeature.getAllDatasets.execute({
          ...input,
          page: input.page,
          limit: input.limit,
          includePrivate: input.includePrivate,
        });
      } catch (error) {
        console.error("Error fetching all datasets:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch datasets",
        });
      }
    }),

  /**
   * Update a dataset - SUPER ADMIN ONLY
   */
  updateDataset: superAdminProcedure
    .input(datasetUpdateSchema)
    .mutation(async ({ input }) => {
      try {
        const updatedDataset =
          await datasetsFeature.updateDataset.execute(input);

        if (!updatedDataset) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Dataset not found",
          });
        }

        return {
          success: true,
          message: "Dataset updated successfully",
          dataset: updatedDataset,
        };
      } catch (error) {
        console.error("Error updating dataset:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update dataset",
        });
      }
    }),

  /**
   * Delete a dataset - SUPER ADMIN ONLY
   */
  deleteDataset: superAdminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      try {
        const deletedDataset = await datasetsFeature.deleteDataset.execute(
          input.id,
        );

        if (!deletedDataset) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Dataset not found",
          });
        }

        return {
          success: true,
          message: "Dataset deleted successfully",
        };
      } catch (error) {
        console.error("Error deleting dataset:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete dataset",
        });
      }
    }),

  /**
   * Get dataset categories and statistics
   */
  getDatasetCategories: publicProcedure.query(async () => {
    try {
      return await datasetsFeature.getDatasetCategories.execute();
    } catch (error) {
      console.error("Error fetching dataset categories:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch categories",
      });
    }
  }),

  /**
   * Get dashboard statistics for super admin
   */
  getDashboardStats: superAdminProcedure.query(async () => {
    try {
      return await superAdminForms.getDashboardStatsForSuperAdmin.execute();
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch dashboard statistics",
      });
    }
  }),

  /**
   * Get recent activity for super admin dashboard
   */
  getRecentActivity: superAdminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      }),
    )
    .query(async ({ input }) => {
      try {
        return await superAdminForms.getRecentActivityForSuperAdmin.execute(
          input,
        );
      } catch (error) {
        console.error("Error fetching recent activity:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch recent activity",
        });
      }
    }),

  /**
   * Get pending applications for super admin dashboard
   */
  getPendingApplications: superAdminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(5),
      }),
    )
    .query(async ({ input }) => {
      try {
        return await superAdminForms.getPendingApplicationsForSuperAdmin.execute(
          input,
        );
      } catch (error) {
        console.error("Error fetching pending applications:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch pending applications",
        });
      }
    }),

  /**
   * Get critical incidents for super admin dashboard
   */
  /**
   * Get organization type distribution for analytics
   */
  getOrganizationTypeDistribution: superAdminProcedure.query(async () => {
    try {
      return await superAdminForms.getOrganizationTypeDistributionForSuperAdmin.execute();
    } catch (error) {
      console.error("Error fetching organization types:", error);
      // Return some default data if there's an error
      return [
        { name: "NGO", value: 5 },
        { name: "Corporate", value: 3 },
        { name: "Government", value: 2 },
      ];
    }
  }),

  /**
   * Get platform activity trend for analytics
   */
  getPlatformActivityTrend: superAdminProcedure.query(async () => {
    try {
      return await superAdminForms.getPlatformActivityTrendForSuperAdmin.execute();
    } catch (error) {
      console.error("Error fetching platform activity trend:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch platform activity trend",
      });
    }
  }),

  getCriticalIncidents: superAdminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(5),
      }),
    )
    .query(async ({ input }) => {
      try {
        return await superAdminForms.getCriticalIncidentsForSuperAdmin.execute(
          input,
        );
      } catch (error) {
        console.error("Error fetching critical incidents:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch critical incidents",
        });
      }
    }),

  anonymousReports: anonymousReportingRouter,
  organizationReports: organizationReportingRouter,
  notifications: notificationRouter,
  alertSubscriptions: alertSubscriptionsRouter,

  /**
   * Get organization dashboard stats - ORGANIZATION SCOPED
   */
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
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }
        console.error("Failed to fetch dashboard stats:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch dashboard stats",
        });
      }
    },
  ),

  /**
   * Get recent organization activity - ORGANIZATION SCOPED
   */
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
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }
        console.error("Failed to fetch recent activity:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch recent activity",
        });
      }
    }),

  /**
   * Get recent organization incidents for dashboard - ORGANIZATION SCOPED
   */
  getOrganizationRecentIncidents: organizationProcedure
    .input(z.object({ limit: z.number().default(5) }))
    .query(async ({ input, ctx }) => {
      const userWithOrg = ctx.user as typeof ctx.user & {
        organizationId?: string;
      };

      if (!userWithOrg.organizationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User must be associated with an organization",
        });
      }

      try {
        const recentIncidents = await db
          .select({
            id: incidents.id,
            title: sql<string>`CASE 
              WHEN ${incidents.data}->>'incidentType' IS NOT NULL 
              THEN ${incidents.data}->>'incidentType'
              ELSE 'Incident'
            END`,
            status: incidents.status,
            date: incidents.createdAt,
            type: sql<string>`CASE 
              WHEN ${incidents.data}->>'incidentType' IS NOT NULL 
              THEN ${incidents.data}->>'incidentType'
              ELSE 'General Incident'
            END`,
          })
          .from(incidents)
          .where(eq(incidents.organizationId, userWithOrg.organizationId))
          .orderBy(desc(incidents.createdAt))
          .limit(input.limit);

        return recentIncidents.map((incident) => ({
          id: incident.id,
          title: incident.title,
          status: incident.status,
          date: formatRelativeTime(incident.date),
          type: incident.type,
          href: `/admin/incidents/${incident.id}`,
        }));
      } catch (error) {
        console.error("Failed to fetch recent incidents:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch recent incidents",
        });
      }
    }),

  /**
   * Get pending organization reports for dashboard - ORGANIZATION SCOPED
   */
  getOrganizationPendingReports: organizationProcedure
    .input(z.object({ limit: z.number().default(5) }))
    .query(async ({ input, ctx }) => {
      const userWithOrg = ctx.user as typeof ctx.user & {
        organizationId?: string;
      };

      if (!userWithOrg.organizationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User must be associated with an organization",
        });
      }

      try {
        const pendingReports = await db
          .select({
            id: reports.id,
            title: reports.title,
            status: reports.status,
            date: reports.updatedAt,
            type: sql<string>`'Report'`,
          })
          .from(reports)
          .where(
            and(
              eq(reports.organizationId, userWithOrg.organizationId),
              eq(reports.status, "draft"),
            ),
          )
          .orderBy(desc(reports.updatedAt))
          .limit(input.limit);

        return pendingReports.map((report) => ({
          id: report.id,
          title: report.title,
          status: report.status,
          date: formatRelativeTime(report.date),
          type: report.type,
          href: `/admin/reports/${report.id}`,
        }));
      } catch (error) {
        console.error("Failed to fetch pending reports:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch pending reports",
        });
      }
    }),

  /**
   * Get organization incident types analytics for dashboard - ORGANIZATION SCOPED
   */
  getOrganizationIncidentTypesAnalytics: organizationProcedure.query(
    async ({ ctx }) => {
      const userWithOrg = ctx.user as typeof ctx.user & {
        organizationId?: string;
      };

      if (!userWithOrg.organizationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User must be associated with an organization",
        });
      }

      try {
        // Get incident types with their counts for the current month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const incidentTypesData = await db
          .select({
            incidentType: sql<string>`
            CASE 
              WHEN ${incidents.data}->>'incidentType' IS NOT NULL 
              THEN ${incidents.data}->>'incidentType'
              ELSE 'Other'
            END
          `,
            count: count(incidents.id),
          })
          .from(incidents)
          .where(
            and(
              eq(incidents.organizationId, userWithOrg.organizationId),
              gte(incidents.createdAt, startOfMonth),
            ),
          )
          .groupBy(
            sql`
          CASE 
            WHEN ${incidents.data}->>'incidentType' IS NOT NULL 
            THEN ${incidents.data}->>'incidentType'
            ELSE 'Other'
          END
        `,
          )
          .orderBy(desc(count(incidents.id)));

        return incidentTypesData.map((item) => ({
          name: item.incidentType,
          value: item.count,
        }));
      } catch (error) {
        console.error("Failed to fetch incident types analytics:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch incident types analytics",
        });
      }
    },
  ),

  /**
   * Get organization weekly incident trend for dashboard - ORGANIZATION SCOPED
   */
  getOrganizationWeeklyIncidentTrend: organizationProcedure.query(
    async ({ ctx }) => {
      const userWithOrg = ctx.user as typeof ctx.user & {
        organizationId?: string;
      };

      if (!userWithOrg.organizationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User must be associated with an organization",
        });
      }

      try {
        // Get incidents for the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const weeklyData = await db
          .select({
            date: sql<string>`DATE(${incidents.createdAt})`,
            count: count(incidents.id),
          })
          .from(incidents)
          .where(
            and(
              eq(incidents.organizationId, userWithOrg.organizationId),
              gte(incidents.createdAt, sevenDaysAgo),
            ),
          )
          .groupBy(sql`DATE(${incidents.createdAt})`)
          .orderBy(sql`DATE(${incidents.createdAt})`);

        // Create array for last 7 days with day names
        const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const result = [];

        for (let i = 0; i < 7; i++) {
          const currentDate = new Date();
          currentDate.setDate(currentDate.getDate() - (6 - i));
          const dateString = currentDate.toISOString().split("T")[0];
          const dayName = daysOfWeek[currentDate.getDay()];

          const dataForDay = weeklyData.find(
            (item) => item.date === dateString,
          );
          result.push({
            period: dayName,
            value: dataForDay ? dataForDay.count : 0,
          });
        }

        // Calculate current week total and change from previous week
        const currentWeekTotal = result.reduce(
          (sum, day) => sum + day.value,
          0,
        );

        // Get previous week data for comparison
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
        fourteenDaysAgo.setHours(0, 0, 0, 0);

        const previousWeekData = await db
          .select({
            count: count(incidents.id),
          })
          .from(incidents)
          .where(
            and(
              eq(incidents.organizationId, userWithOrg.organizationId),
              gte(incidents.createdAt, fourteenDaysAgo),
              lt(incidents.createdAt, sevenDaysAgo),
            ),
          );

        const previousWeekTotal = previousWeekData[0]?.count || 0;
        const percentageChange =
          previousWeekTotal > 0
            ? ((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100
            : currentWeekTotal > 0
              ? 100
              : 0;

        return {
          data: result,
          currentValue: currentWeekTotal,
          currentChange: Math.round(percentageChange * 10) / 10, // Round to 1 decimal place
          timeframe: "7d" as const,
        };
      } catch (error) {
        console.error("Failed to fetch weekly incident trend:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch weekly incident trend",
        });
      }
    },
  ),
});

// Helper functions
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;

  return date.toLocaleDateString();
}

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

function getActivityHref(type: string, id: string): string {
  switch (type) {
    case "application":
      return `/superadmin/applications`; // Applications go to applications list
    case "admin":
      return `/superadmin/admins`; // Admin users go to admins list
    case "watcher":
      return `/superadmin/watchers`; // Watcher users go to watchers list
    case "incident":
      return `/superadmin/incidents`; // Incidents go to incidents list
    case "report":
      return `/superadmin/reports`; // Reports go to reports list
    case "form":
      return `/superadmin/forms`; // Forms go to forms list
    default:
      return "/superadmin";
  }
}

export type AppRouter = typeof appRouter;
