import { api } from "./client";

export interface IncidentType {
  id: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Incident {
  id: string;
  organizationId: string;
  formId: string;
  reportedByUserId: string;
  formName?: string;
  reporterEmail?: string;
  organizationName?: string;
  data: Record<string, unknown>;
  status: "reported" | "investigating" | "resolved" | "closed";
  createdAt: string;
  updatedAt: string;
}

export interface IncidentStats {
  total: number;
  reported: number;
  investigating: number;
  resolved: number;
  closed: number;
  thisWeek: number;
  lastWeek: number;
  watchers?: { total: number };
  forms?: { total: number; active: number };
  incidents?: { total: number; open: number };
  reports?: { published: number; draft: number };
}

export interface WeeklyTrendPoint {
  week: string;
  count: number;
}

export interface ListParams {
  limit?: number;
  offset?: number;
  search?: string;
  sort?: string;
  sortOrder?: string;
}

export const incidentsApi = {
  // Incident types
  getAllTypes: (activeOnly = true) =>
    api.get<IncidentType[]>(`/incident-types?activeOnly=${activeOnly}`),

  getTypesByOrganization: (orgId: string) =>
    api.get<IncidentType[]>(`/admin/incident-types?organizationId=${orgId}`),

  getAvailableTypes: (orgId: string) =>
    api.get<IncidentType[]>(`/admin/incident-types/available?organizationId=${orgId}`),

  createType: (data: { name: string; description?: string; color: string }) =>
    api.post("/admin/incident-types", data),

  enableType: (orgId: string, typeId: string) =>
    api.post(`/admin/incident-types/${typeId}/enable?organizationId=${orgId}`),

  disableType: (orgId: string, typeId: string) =>
    api.post(`/admin/incident-types/${typeId}/disable?organizationId=${orgId}`),

  // Incidents
  getOrganizationIncidents: (orgId: string, params?: ListParams) => {
    const query = new URLSearchParams({ organizationId: orgId });
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));
    if (params?.search) query.set("search", params.search);
    if (params?.sort) query.set("sort", params.sort);
    if (params?.sortOrder) query.set("sortOrder", params.sortOrder);
    return api.get<Incident[]>(`/admin/incidents?${query}`);
  },

  getIncidentById: (id: string) => api.get<Incident>(`/admin/incidents/${id}`),

  updateIncidentStatus: (id: string, status: string) =>
    api.patch(`/admin/incidents/${id}/status`, { status }),

  getOrganizationStats: (orgId: string) =>
    api.get<IncidentStats>(`/admin/analytics/stats?organizationId=${orgId}`),

  getWeeklyTrend: (orgId: string) =>
    api.get<WeeklyTrendPoint[]>(`/admin/analytics/trend?organizationId=${orgId}`),

  getDashboardStats: (orgId: string) =>
    api.get<IncidentStats>(`/admin/dashboard?organizationId=${orgId}`),

  // Watcher incident submission
  submitIncident: (data: { formId: string; data: Record<string, unknown> }) =>
    api.post("/incidents", data),

  // Org reports
  submitOrgReport: (data: {
    incidentTypeId: string;
    location: { latitude: number; longitude: number; address?: string; country?: string };
    description: string;
    entities?: string[];
    injuries?: number;
    fatalities?: number;
    severity?: string;
    evidenceFileKey?: string;
    audioFileKey?: string;
  }) => api.post("/org/incident-reports", data),

  getOrgReports: (orgId: string, params?: ListParams) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));
    return api.get<unknown[]>(`/org/incident-reports?${query}`);
  },

  getOrgReportStats: (orgId: string) =>
    api.get<IncidentStats>(`/org/incident-reports/stats?organizationId=${orgId}`),

  getPending: (orgId: string) =>
    api.get<Incident[]>(`/admin/analytics/pending?organizationId=${orgId}`),

  getTypeAnalytics: (orgId: string) =>
    api.get<{ name: string; value: number }[]>(`/admin/analytics/types?organizationId=${orgId}`),

  // Super admin
  getAllIncidents: (params?: ListParams) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));
    if (params?.search) query.set("search", params.search);
    const qs = query.toString();
    return api.get<Incident[]>(`/superadmin/incidents${qs ? `?${qs}` : ""}`);
  },

  deleteIncident: (id: string) => api.delete(`/superadmin/incidents/${id}`),

  // Anonymous reporting
  submitAnonymousReport: (data: {
    incidentTypeId: string;
    location: { latitude: number; longitude: number; address?: string; country?: string };
    description: string;
    entities?: string[];
    injuries?: number;
    fatalities?: number;
    evidenceFileKey?: string;
    audioFileKey?: string;
  }) => api.post("/incidents/anonymous", data),

  getAnonymousReports: (params?: { country?: string; category?: string }) => {
    const query = new URLSearchParams();
    if (params?.country) query.set("country", params.country);
    if (params?.category) query.set("category", params.category);
    const qs = query.toString();
    return api.get<unknown[]>(`/incidents/anonymous${qs ? `?${qs}` : ""}`);
  },

  getHeatmapData: () => api.get<{ latitude: number; longitude: number; weight: number }[]>(
    "/incidents/heatmap"
  ),
};
