import { api } from "./client";
import type { Incident, IncidentStats, WeeklyTrendPoint } from "./incidents";
import type { Form } from "./forms";

export interface DashboardStats {
  total: number;
  reported: number;
  investigating: number;
  resolved: number;
  closed: number;
  thisWeek: number;
  lastWeek: number;
}

export interface WatcherUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  role: string;
  organizationId?: string;
  banned: boolean;
  banReason?: string;
  banExpires?: string;
  createdAt: string;
  updatedAt: string;
}

interface GrowthMetric {
  current: number;
  previous: number;
  percentage: number;
}

/** The super admin's dashboard, as entity.PlatformStats serialises it. */
export interface PlatformStats {
  totalOrganizations: number;
  pendingApplications: number;
  deployments: { total: number; draft: number; live: number; closed: number };
  /** Public reports: this month (current) against last month (previous). */
  reports: GrowthMetric;
  growth: { organizations: GrowthMetric };
}

export interface OrganizationTypeDistribution {
  name: string;
  value: number;
}

// Forms
export const adminApi = {
  // Watchers
  getOrganizationWatchers: (orgId: string) =>
    api.get<WatcherUser[]>(`/admin/watchers?organizationId=${orgId}`),

  // Creates the account in the admin's organization and emails a set-password link.
  inviteUser: (data: { name: string; email: string; role?: string }) =>
    api.post<WatcherUser>("/admin/watchers", data),

  // Forms
  getOrganizationForms: (orgId: string) =>
    api.get<Form[]>(`/admin/forms?organizationId=${orgId}`),

  getFormById: (id: string) => api.get<Form>(`/admin/forms/${id}`),

  saveForm: (data: { name: string; definition: Record<string, unknown>; isActive?: boolean }, orgId: string) =>
    api.post("/admin/forms", { ...data, organizationId: orgId }),

  updateForm: (id: string, data: { name?: string; definition?: Record<string, unknown>; isActive?: boolean }) =>
    api.patch(`/admin/forms/${id}`, data),

  deleteForm: (id: string) => api.delete(`/admin/forms/${id}`),

  getActiveFormsForWatcher: (orgId: string) =>
    api.get<Form[]>(`/watcher/forms?organizationId=${orgId}`),

  // Analytics
  getDashboardStats: (orgId: string) =>
    api.get<IncidentStats>(`/admin/dashboard?organizationId=${orgId}`),

  getWeeklyTrend: (orgId: string) =>
    api.get<WeeklyTrendPoint[]>(`/admin/analytics/trend?organizationId=${orgId}`),

  getOrganizationIncidentTypesAnalytics: (orgId: string) =>
    api.get<{ name: string; value: number }[]>(`/admin/analytics/types?organizationId=${orgId}`),

  // Super admin
  getAllAdmins: () => api.get<WatcherUser[]>("/superadmin/users/admins"),

  getAllForms: (params?: { limit?: number; offset?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));
    if (params?.search) query.set("search", params.search);
    const qs = query.toString();
    return api.get<Form[]>(`/superadmin/forms${qs ? `?${qs}` : ""}`);
  },

  getPendingApplications: () =>
    api.get<unknown[]>("/superadmin/applications"),

  getPlatformStats: () => api.get<PlatformStats>("/superadmin/dashboard/stats"),


  getPlatformActivityTrend: () =>
    api.get<{ week: string; count: number }[]>("/superadmin/dashboard/trend"),

  getPlatformReportsByType: () =>
    api.get<{ name: string; count: number }[]>("/superadmin/dashboard/report-types"),
};
