import { TRPCError } from "@trpc/server";
import z from "zod";
import { publicProcedure, router } from "../trpc";
import { authApi } from "@/lib/api/auth";
import { organizationsApi } from "@/lib/api/organizations";
import { incidentsApi } from "@/lib/api/incidents";
import { adminApi } from "@/lib/api/admin";
import { anonymousReportingRouter } from "./anonymous-reporting";
import { alertSubscriptionsRouter } from "./alert-subscriptions";
import { notificationRouter } from "./notifications";
import { organizationReportingRouter } from "./organization-reporting";

export const coreRouter = router({
  healthCheck: publicProcedure.query(() => {
    return { data: "OK" };
  }),

  getCurrentUser: publicProcedure.query(async () => {
    try {
      const res = await authApi.me();
      if (!res.success || !res.data) {
        return { id: "", role: "", organizationId: undefined };
      }
      return res.data;
    } catch {
      return { id: "", role: "", organizationId: undefined };
    }
  }),

  submitOrganizationApplication: publicProcedure
    .input(
      z.object({
        organizationName: z.string(),
        applicantName: z.string(),
        applicantEmail: z.string().email(),
        website: z.string().optional(),
        certificateOfIncorporation: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const res = await organizationsApi.submitApplication(input);
      if (!res.success) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: res.error ?? "Failed" });
      }
      return res.data;
    }),

  getAllOrganizatons: publicProcedure.query(async () => {
    const res = await organizationsApi.list({ limit: 100 });
    if (!res.success) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: res.error ?? "Failed" });
    }
    return { data: res.data?.data ?? [], total: res.data?.total ?? 0 };
  }),

  submitIncident: publicProcedure
    .input(
      z.object({
        formId: z.string(),
        data: z.record(z.string(), z.any()),
      }),
    )
    .mutation(async ({ input }) => {
      const res = await incidentsApi.submitIncident(input);
      if (!res.success) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: res.error ?? "Failed" });
      }
      return res.data;
    }),

  getActiveFormsForWatcher: publicProcedure.query(async ({ ctx }) => {
    try {
      const orgId = (ctx as { user?: { organizationId?: string } }).user?.organizationId;
      if (!orgId) return [];
      const res = await adminApi.getActiveFormsForWatcher(orgId);
      if (!res.success) throw new Error(res.error ?? "Failed to fetch forms");
      return res.data ?? [];
    } catch (error) {
      console.error("Failed to fetch active forms for watcher:", error);
      return [];
    }
  }),

  anonymousReports: anonymousReportingRouter,
  organizationReports: organizationReportingRouter,
  notifications: notificationRouter,
  alertSubscriptions: alertSubscriptionsRouter,
});
