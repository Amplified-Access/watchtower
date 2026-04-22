import { api } from "./client";

export interface Report {
  id: string;
  organizationId: string;
  reportedByUserId: string;
  reportedById?: string;
  title: string;
  fileKey: string;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
  organizationName?: string;
  organizationSlug?: string;
  authorName?: string;
  authorEmail?: string;
}

export interface ListParams {
  limit?: number;
  offset?: number;
  search?: string;
  sort?: string;
  sortOrder?: string;
}

export const reportsApi = {
  getPublicReports: (params?: ListParams) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));
    if (params?.search) query.set("search", params.search);
    const qs = query.toString();
    return api.get<{ data: Report[]; total: number }>(`/reports${qs ? `?${qs}` : ""}`);
  },

  getPublicReportById: (id: string) => api.get<Report>(`/reports/${id}`),

  getOrganizationReports: (orgId: string, status?: string) => {
    const query = new URLSearchParams();
    if (status) query.set("status", status);
    const qs = query.toString();
    return api.get<Report[]>(`/admin/reports?organizationId=${orgId}${qs ? `&${qs}` : ""}`);
  },

  getReportById: (id: string) => api.get<Report>(`/admin/reports/${id}`),

  createReport: (data: { title: string; fileKey: string; status?: string }) =>
    api.post("/admin/reports", data),

  updateReport: (id: string, data: { title?: string; status?: string }) =>
    api.patch(`/admin/reports/${id}`, data),

  deleteReport: (id: string) => api.delete(`/admin/reports/${id}`),

  getAllReports: (params?: ListParams) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));
    if (params?.search) query.set("search", params.search);
    const qs = query.toString();
    return api.get<{ data: Report[]; total: number }>(`/superadmin/reports${qs ? `?${qs}` : ""}`);
  },
};
