import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router } from "../trpc";
import { superAdminProcedure } from "../middleware";
import { adminApi } from "@/lib/api/admin";
import { organizationsApi } from "@/lib/api/organizations";
import { incidentsApi } from "@/lib/api/incidents";
import { reportsApi } from "@/lib/api/reports";

export const superAdminRouter = router({
  getAllOrganizatonApplications: superAdminProcedure.query(async () => {
    try {
      const res = await organizationsApi.getApplications();
      if (!res.success) throw new Error(res.error ?? "Failed to fetch applications");
      return { success: true, data: res.data };
    } catch (error) {
      console.error("Error fetching applications:", error);
      return { success: false, message: "Failed to fetch applications.", data: [] };
    }
  }),

  approveOrganizationApplication: superAdminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const res = await organizationsApi.approveApplication(input.id);
        if (!res.success) throw new Error(res.error ?? "Failed to approve");
        return { success: true };
      } catch (error) {
        console.error("Error approving application:", error);
        return { success: false, message: "Failed to approve application." };
      }
    }),

  declineOrganizationApplication: superAdminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const res = await organizationsApi.declineApplication(input.id);
        if (!res.success) throw new Error(res.error ?? "Failed to decline");
        return { success: true };
      } catch (error) {
        console.error("Error declining application:", error);
        return { success: false, message: "Failed to decline application." };
      }
    }),

  getAllAdmins: superAdminProcedure.query(async () => {
    try {
      const res = await adminApi.getAllAdmins();
      if (!res.success) throw new Error(res.error ?? "Failed to fetch admins");
      return { success: true, data: res.data };
    } catch (error) {
      console.error("Error fetching admins:", error);
      return { success: false, message: "Failed to fetch admins.", data: [] };
    }
  }),

  getAllWatchers: superAdminProcedure.query(async () => {
    try {
      const res = await adminApi.getAllWatchers();
      if (!res.success) throw new Error(res.error ?? "Failed to fetch watchers");
      return { success: true, data: res.data };
    } catch (error) {
      console.error("Error fetching watchers:", error);
      return { success: false, message: "Failed to fetch watchers.", data: [] };
    }
  }),

  getAllIncidentsForSuperAdmin: superAdminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.enum(["reported", "investigating", "resolved", "closed"]).optional(),
        organizationId: z.string().optional(),
        sortBy: z.enum(["createdAt", "updatedAt", "status"]).default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }),
    )
    .query(async ({ input }) => {
      try {
        const res = await incidentsApi.getAllIncidents({
          limit: input.limit,
          offset: input.offset,
          search: input.search,
        });
        if (!res.success) throw new Error(res.error ?? "Failed to fetch incidents");
        return { incidents: res.data?.data ?? [], totalCount: res.data?.total ?? 0 };
      } catch (error) {
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
        const res = await incidentsApi.getIncidentById(input.incidentId);
        if (!res.success) {
          if (res.error?.includes("404")) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Incident not found" });
          }
          throw new Error(res.error ?? "Failed to fetch incident");
        }
        return res.data ?? null;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
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
        const res = await incidentsApi.updateIncidentStatus(input.incidentId, input.status);
        if (!res.success) throw new Error(res.error ?? "Failed to update status");
        return { success: true };
      } catch (error) {
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
        const res = await incidentsApi.deleteIncident(input.incidentId);
        if (!res.success) throw new Error(res.error ?? "Failed to delete incident");
        return { success: true };
      } catch (error) {
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
        limit: z.number().default(50),
        offset: z.number().default(0),
      }),
    )
    .query(async ({ input }) => {
      try {
        const res = await adminApi.getAllForms({
          limit: input.limit,
          offset: input.offset,
          search: input.search,
        });
        if (!res.success) throw new Error(res.error ?? "Failed to fetch forms");
        return { forms: res.data?.data ?? [], totalCount: res.data?.total ?? 0 };
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
        const res = await adminApi.getFormById(input.formId);
        if (!res.success) throw new Error(res.error ?? "Failed to fetch form");
        return res.data ?? null;
      } catch (error) {
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
        const res = await adminApi.updateForm(input.formId, {
          name: input.name,
          definition: input.definition,
          isActive: input.isActive,
        });
        if (!res.success) throw new Error(res.error ?? "Failed to update form");
        return { success: true };
      } catch (error) {
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
        const res = await adminApi.deleteForm(input.formId);
        if (!res.success) throw new Error(res.error ?? "Failed to delete form");
        return { success: true };
      } catch (error) {
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
        sortBy: z.enum(["createdAt", "updatedAt", "title"]).default("updatedAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }),
    )
    .query(async ({ input }) => {
      try {
        const res = await reportsApi.getAllReports({
          limit: input.limit,
          offset: input.offset,
          search: input.search,
        });
        if (!res.success) throw new Error(res.error ?? "Failed to fetch reports");
        return { reports: res.data?.data ?? [], totalCount: res.data?.total ?? 0 };
      } catch (error) {
        console.error("Failed to retrieve reports:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve reports",
        });
      }
    }),

  getDashboardStats: superAdminProcedure.query(async () => {
    try {
      const res = await adminApi.getPlatformStats();
      if (!res.success) throw new Error(res.error ?? "Failed to fetch platform stats");
      const data = res.data;
      return {
        totalOrganizations: data?.totalOrganizations ?? 0,
        totalAdmins: data?.totalAdmins ?? 0,
        totalWatchers: data?.totalWatchers ?? 0,
        pendingApplications: data?.pendingApplications ?? 0,
        reportsThisMonth: data?.reportsThisMonth ?? 0,
        activeForms: data?.activeForms ?? 0,
        criticalIncidents: data?.criticalIncidents ?? 0,
        uptimePercentage: data?.uptimePercentage ?? 99.9,
        growth: {
          organizations: data?.growth?.organizations ?? { current: 0, previous: 0, percentage: 0 },
          admins: data?.growth?.admins ?? { current: 0, previous: 0, percentage: 0 },
          watchers: data?.growth?.watchers ?? { current: 0, previous: 0, percentage: 0 },
        },
        metrics: {
          newOrganizationsThisMonth: data?.metrics?.newOrganizationsThisMonth ?? 0,
          newAdminsThisMonth: data?.metrics?.newAdminsThisMonth ?? 0,
          newWatchersThisMonth: data?.metrics?.newWatchersThisMonth ?? 0,
          averageReportsPerOrg: data?.metrics?.averageReportsPerOrg ?? 0,
        },
      };
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
        const res = await adminApi.getRecentActivity(input.limit);
        if (!res.success) throw new Error(res.error ?? "Failed to fetch activity");
        return res.data ?? [];
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
    .query(async () => {
      try {
        const res = await organizationsApi.getApplications();
        if (!res.success) throw new Error(res.error ?? "Failed to fetch applications");
        const pending = res.data?.filter((a) => a.status === "pending") ?? [];
        return pending;
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
        const res = await incidentsApi.getAllIncidents({ limit: input.limit });
        if (!res.success) throw new Error(res.error ?? "Failed to fetch incidents");
        return res.data?.data ?? [];
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
      // Not yet in Go backend
      return [
        { name: "NGO", value: 5 },
        { name: "Corporate", value: 3 },
        { name: "Government", value: 2 },
      ];
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
      // Not yet in Go backend
      return {
        data: [],
        currentValue: 0,
        currentChange: 0,
        timeframe: "7w",
      };
    } catch (error) {
      console.error("Error fetching platform activity trend:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch platform activity trend",
      });
    }
  }),
});
