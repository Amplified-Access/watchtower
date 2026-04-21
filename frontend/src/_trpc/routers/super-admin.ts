import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router } from "../trpc";
import { superAdminProcedure } from "../middleware";
import {
  createSuperAdminFormUseCases,
  SuperAdminFormNotFoundError,
  SuperAdminFormValidationError,
} from "@/features/super-admin";
import { createOrganizationRegistrationUseCases } from "@/features/organization-registration";

const superAdminForms = createSuperAdminFormUseCases();
const organizationRegistration = createOrganizationRegistrationUseCases();

export const superAdminRouter = router({
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

  approveOrganizationApplication: superAdminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      try {
        return await organizationRegistration.approveOrganizationApplication.execute(
          input.id,
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

  declineOrganizationApplication: superAdminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      try {
        return await organizationRegistration.declineOrganizationApplication.execute(
          input.id,
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
        return await superAdminForms.getAllIncidentsForSuperAdmin.execute(input);
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
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        console.error("Failed to delete form:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete form",
        });
      }
    }),

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

  getRecentActivity: superAdminProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
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

  getPendingApplications: superAdminProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(5) }))
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

  getCriticalIncidents: superAdminProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(5) }))
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

  getOrganizationTypeDistribution: superAdminProcedure.query(async () => {
    try {
      return await superAdminForms.getOrganizationTypeDistributionForSuperAdmin.execute();
    } catch (error) {
      console.error("Error fetching organization types:", error);
      return [
        { name: "NGO", value: 5 },
        { name: "Corporate", value: 3 },
        { name: "Government", value: 2 },
      ];
    }
  }),

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
});
