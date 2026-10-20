import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router } from "../trpc";
import { superAdminProcedure } from "../middleware";
import { adminApi } from "@/lib/api/admin";
import { organizationsApi } from "@/lib/api/organizations";
import { incidentsApi } from "@/lib/api/incidents";
import { deploymentsApi } from "@/lib/api/deployments";

export const superAdminRouter = router({
  // Every deployment, or one organization's.
  getAllDeployments: superAdminProcedure
    .input(z.object({ organizationId: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const res = await deploymentsApi.getAll(input?.organizationId);
      if (!res.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: res.error ?? "Failed to fetch deployments",
        });
      }
      return res.data ?? [];
    }),

  // Every organization with how many deployments it has made.
  getOrganizationsWithDeploymentCounts: superAdminProcedure.query(async () => {
    const res = await organizationsApi.listWithDeploymentCounts();
    if (!res.success) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: res.error ?? "Failed to fetch organizations",
      });
    }
    return res.data ?? [];
  }),

  // Every incident type on the platform, active or not: the super admin's
  // incident types page, which isn't about any one organization's set.
  getAllIncidentTypesForSuperAdmin: superAdminProcedure.query(async () => {
    const res = await incidentsApi.getAllTypes(false);
    if (!res.success) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: res.error ?? "Failed to fetch incident types",
      });
    }
    return res.data ?? [];
  }),

  createIncidentTypeAsSuperAdmin: superAdminProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required").max(100, "Name too long"),
        description: z.string().optional(),
        color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color").default("#ef4444"),
      }),
    )
    .mutation(async ({ input }) => {
      const res = await incidentsApi.createTypeAsSuperAdmin(input);
      if (!res.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: res.error ?? "Failed to create incident type",
        });
      }
      return { success: true, data: res.data };
    }),

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
        return { forms: res.data ?? [], totalCount: res.total ?? 0 };
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
        return res.data ?? [];
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
      const res = await adminApi.getPlatformReportsByType();
      if (!res.success) throw new Error(res.error ?? "Failed to fetch report types");
      return (res.data ?? []).map((d) => ({ name: d.name, value: d.count }));
    } catch (error) {
      console.error("Error fetching report type distribution:", error);
      return [] as { name: string; value: number }[];
    }
  }),

  getPlatformActivityTrend: superAdminProcedure.query(async () => {
    try {
      const res = await adminApi.getPlatformActivityTrend();
      if (!res.success) throw new Error(res.error ?? "Failed to fetch trend");
      const points = res.data ?? [];
      const currentValue = points.length > 0 ? points[points.length - 1].count : 0;
      const previousValue = points.length > 1 ? points[points.length - 2].count : 0;
      const currentChange = previousValue > 0
        ? Math.round((currentValue - previousValue) / previousValue * 100)
        : 0;
      return {
        data: points,
        currentValue,
        currentChange,
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
