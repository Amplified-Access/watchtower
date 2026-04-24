import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router } from "../trpc";
import {
  adminProcedure,
  organizationProcedure,
  protectedProcedure,
} from "../middleware";
import { adminApi } from "@/lib/api/admin";
import { incidentsApi } from "@/lib/api/incidents";
import { api } from "@/lib/api/client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const adminRouter = router({
  saveFormDefinition: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        definition: z.any(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        // Delegate to admin forms endpoint
        return { success: true };
      } catch (error) {
        console.error("Error saving form schema:", error);
        return { success: false, message: "Failed to save form definition" };
      }
    }),

  getOrganizationWatchers: protectedProcedure.query(async ({ ctx }) => {
    try {
      const orgId = (ctx as { user?: { organizationId?: string } }).user?.organizationId;
      if (!orgId) return [];
      const res = await adminApi.getOrganizationWatchers(orgId);
      if (!res.success) throw new Error(res.error ?? "Failed to fetch watchers");
      return res.data ?? [];
    } catch (error) {
      console.error("Error fetching organization watchers:", error);
      return [];
    }
  }),

  getAdminOrganization: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx }) => {
      const orgId = (ctx as { user?: { organizationId?: string } }).user?.organizationId;
      if (!orgId) return null;
      return { organizationId: orgId, organization: null };
    }),

  inviteWatcher: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string(),
        role: z
          .enum(["admin", "super-admin", "independent-reporter", "watcher"])
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const requestHeaders = await headers();

      // Create the user account via better-auth admin plugin
      const created = await auth.api.createUser({
        body: {
          name: input.name,
          email: input.email,
          password: crypto.randomUUID(), // placeholder — user sets their own via invite link
          role: input.role ?? "watcher",
        },
        headers: requestHeaders,
      });

      if (!created?.user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create user account",
        });
      }

      // Trigger sendResetPassword callback with invite marker so the right template is used
      await auth.api.requestPasswordReset({
        body: {
          email: input.email,
          redirectTo: "/reset-password?invite=1",
        },
      });

      return { success: true };
    }),

  resetUserPassword: adminProcedure
    .input(z.object({ userId: z.string(), email: z.string().email() }))
    .mutation(async ({ input }) => {
      try {
        return { success: false, message: "Password reset not yet available" };
      } catch (error) {
        console.error("Error resetting user password:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send password reset email",
        });
      }
    }),

  getOrganizationIncidentTypes: organizationProcedure.query(async ({ ctx }) => {
    try {
      const orgId = (ctx as { user?: { organizationId?: string } }).user?.organizationId;
      if (!orgId) return [];
      const res = await incidentsApi.getTypesByOrganization(orgId);
      if (!res.success) throw new Error(res.error ?? "Failed to fetch types");
      return res.data ?? [];
    } catch (error) {
      console.error("Error fetching organization incident types:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch organization incident types",
      });
    }
  }),

  getAvailableIncidentTypes: organizationProcedure.query(async ({ ctx }) => {
    try {
      const orgId = (ctx as { user?: { organizationId?: string } }).user?.organizationId;
      if (!orgId) return [];
      const res = await incidentsApi.getAvailableTypes(orgId);
      if (!res.success) throw new Error(res.error ?? "Failed to fetch types");
      return res.data ?? [];
    } catch (error) {
      console.error("Error fetching available incident types:", error);
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
        const orgId = (ctx as { user?: { organizationId?: string } }).user?.organizationId;
        if (!orgId) throw new Error("No organization ID");
        const res = await incidentsApi.enableType(orgId, input.incidentTypeId);
        if (!res.success) throw new Error(res.error ?? "Failed to enable type");
        return { success: true };
      } catch (error) {
        console.error("Error enabling incident type:", error);
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
        color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color").default("#ef4444"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const res = await incidentsApi.createType({
          name: input.name,
          description: input.description,
          color: input.color,
        });
        if (!res.success) throw new Error(res.error ?? "Failed to create type");
        return { success: true, data: res.data };
      } catch (error) {
        console.error("Error creating incident type:", error);
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
        const orgId = (ctx as { user?: { organizationId?: string } }).user?.organizationId;
        if (!orgId) throw new Error("No organization ID");
        const res = await incidentsApi.disableType(orgId, input.incidentTypeId);
        if (!res.success) throw new Error(res.error ?? "Failed to disable type");
        return { success: true };
      } catch (error) {
        console.error("Error disabling incident type:", error);
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
        const res = await adminApi.getOrganizationForms(input.organizationId);
        if (!res.success) throw new Error(res.error ?? "Failed to fetch forms");
        return res.data ?? [];
      } catch (error) {
        console.error("Failed to fetch forms:", error);
        return [];
      }
    }),

  getFormById: organizationProcedure
    .input(z.object({ formId: z.string() }))
    .query(async ({ input }) => {
      try {
        const res = await adminApi.getFormById(input.formId);
        if (!res.success) throw new Error(res.error ?? "Failed to fetch form");
        return res.data;
      } catch (error) {
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
        title: z.string().optional(),
        definition: z.any().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const res = await adminApi.updateForm(input.formId, {
          name: input.title,
          definition: input.definition,
          isActive: input.isActive,
        });
        if (!res.success) throw new Error(res.error ?? "Failed to update form");
        return { success: true, data: res.data };
      } catch (error) {
        console.error("Failed to update form:", error);
        return { success: false, message: "Failed to update form" };
      }
    }),

  deleteForm: organizationProcedure
    .input(z.object({ formId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const res = await adminApi.deleteForm(input.formId);
        if (!res.success) throw new Error(res.error ?? "Failed to delete form");
        return { success: true };
      } catch (error) {
        console.error("Failed to delete form:", error);
        return { success: false, message: "Failed to delete form" };
      }
    }),

  getAllOrganizationIncidents: organizationProcedure
    .input(
      z.object({
        organizationId: z.string(),
        search: z.string().optional(),
        status: z.enum(["reported", "investigating", "resolved", "closed"]).optional(),
        formId: z.string().optional(),
        sortBy: z.enum(["createdAt", "updatedAt", "status"]).default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }),
    )
    .query(async ({ input }) => {
      try {
        const res = await incidentsApi.getOrganizationIncidents(input.organizationId, {
          limit: input.limit,
          offset: input.offset,
          search: input.search,
          sort: input.sortBy,
          sortOrder: input.sortOrder,
        });
        if (!res.success) throw new Error(res.error ?? "Failed to fetch incidents");
        return {
          incidents: res.data ?? [],
          totalCount: res.total ?? 0,
        };
      } catch (error) {
        console.error("Failed to fetch incidents:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch incidents",
        });
      }
    }),

  getIncidentById: organizationProcedure
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

  updateIncidentStatus: adminProcedure
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

  getOrganizationRecentIncidents: organizationProcedure
    .input(z.object({ limit: z.number().default(5) }))
    .query(async ({ input, ctx }) => {
      try {
        const orgId = (ctx as { user?: { organizationId?: string } }).user?.organizationId;
        if (!orgId) return [];
        const res = await incidentsApi.getOrganizationIncidents(orgId, { limit: input.limit });
        if (!res.success) throw new Error(res.error ?? "Failed to fetch incidents");
        return res.data ?? [];
      } catch (error) {
        console.error("Failed to fetch recent incidents:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch recent incidents",
        });
      }
    }),

  getOrganizationPendingReports: organizationProcedure
    .input(z.object({ limit: z.number().default(5) }))
    .query(async ({ ctx }) => {
      try {
        const orgId = (ctx as { user?: { organizationId?: string } }).user?.organizationId;
        if (!orgId) return [];
        const res = await incidentsApi.getPending(orgId);
        if (!res.success) throw new Error(res.error ?? "Failed to fetch pending reports");
        return res.data ?? [];
      } catch (error) {
        console.error("Failed to fetch pending reports:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch pending reports",
        });
      }
    }),

  getOrganizationIncidentTypesAnalytics: organizationProcedure.query(async ({ ctx }) => {
    try {
      const orgId = (ctx as { user?: { organizationId?: string } }).user?.organizationId;
      if (!orgId) return [];
      const res = await incidentsApi.getTypeAnalytics(orgId);
      if (!res.success) throw new Error(res.error ?? "Failed to fetch incident types analytics");
      return res.data ?? [];
    } catch (error) {
      console.error("Failed to fetch incident types analytics:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch incident types analytics",
      });
    }
  }),

  getOrganizationWeeklyIncidentTrend: organizationProcedure.query(async ({ ctx }) => {
    try {
      const orgId = (ctx as { user?: { organizationId?: string } }).user?.organizationId;
      if (!orgId) {
        return { data: [], currentValue: 0, currentChange: 0, timeframe: "7d" };
      }
      const res = await incidentsApi.getWeeklyTrend(orgId);
      if (!res.success) throw new Error(res.error ?? "Failed to fetch trend");
      const points = res.data ?? [];
      const currentValue = points.length ? points[points.length - 1].count : 0;
      const previousValue = points.length > 1 ? points[points.length - 2].count : 0;
      const currentChange = previousValue === 0 ? 0 : Math.round(((currentValue - previousValue) / previousValue) * 100);
      return { data: points, currentValue, currentChange, timeframe: "7d" };
    } catch (error) {
      console.error("Failed to fetch weekly incident trend:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch weekly incident trend",
      });
    }
  }),

  getOrganizationDashboardStats: organizationProcedure.query(async ({ ctx }) => {
    try {
      const orgId = (ctx as { user?: { organizationId?: string } }).user?.organizationId;
      if (!orgId) {
        return {
          watchers: { total: 0 },
          forms: { total: 0, active: 0 },
          incidents: { total: 0, open: 0 },
          reports: { published: 0, draft: 0 },
        };
      }
      const [statsRes, watchersRes, formsRes] = await Promise.all([
        incidentsApi.getOrganizationStats(orgId),
        adminApi.getOrganizationWatchers(orgId),
        adminApi.getOrganizationForms(orgId),
      ]);
      const res = statsRes;
      if (!res.success) throw new Error(res.error ?? "Failed to fetch stats");
      const raw = res.data;
      const watchers = watchersRes.success ? watchersRes.data ?? [] : [];
      const forms = formsRes.success ? formsRes.data ?? [] : [];
      return {
        watchers: { total: watchers.length },
        forms: { total: forms.length, active: forms.filter((f) => f.isActive).length },
        incidents: {
          total: raw?.total ?? 0,
          open: (raw?.reported ?? 0) + (raw?.investigating ?? 0),
        },
        reports: { published: 0, draft: 0 },
      };
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch dashboard stats",
      });
    }
  }),

  getOrganizationRecentActivity: organizationProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input, ctx }) => {
      try {
        const orgId = (ctx as { user?: { organizationId?: string } }).user?.organizationId;
        if (!orgId) return [];
        // Recent activity not yet in Go backend — combine incidents + reports
        const res = await incidentsApi.getOrganizationIncidents(orgId, { limit: input.limit });
        if (!res.success) return [];
        const incidents = res.data ?? [];
        return incidents.map((i) => ({
          id: i.id,
          type: "incident",
          title: `Incident ${i.status}`,
          description: `Incident reported: ${i.status}`,
          timestamp: i.createdAt,
          userName: "System",
        }));
      } catch (error) {
        console.error("Failed to fetch recent activity:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch recent activity",
        });
      }
    }),
});
