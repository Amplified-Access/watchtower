import { api } from "./client";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  website?: string;
  location?: string;
  contactEmail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationApplication {
  id: number;
  organizationName: string;
  applicantName: string;
  applicantEmail: string;
  website?: string;
  certificateOfIncorporation?: string;
  status: "pending" | "approved" | "declined";
  createdAt: string;
  updatedAt: string;
}

export interface ListParams {
  limit?: number;
  offset?: number;
  search?: string;
  sort?: string;
  sortOrder?: string;
}

export const organizationsApi = {
  list: (params?: ListParams) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));
    if (params?.search) query.set("search", params.search);
    if (params?.sort) query.set("sort", params.sort);
    if (params?.sortOrder) query.set("sortOrder", params.sortOrder);
    const qs = query.toString();
    return api.get<{ data: Organization[]; total: number }>(`/organizations${qs ? `?${qs}` : ""}`);
  },

  getBySlug: (slug: string) => api.get<Organization>(`/organizations/${slug}`),

  submitApplication: (data: {
    organizationName: string;
    applicantName: string;
    applicantEmail: string;
    website?: string;
    certificateOfIncorporation?: string;
  }) => api.post("/organizations/apply", data),

  getApplications: () => api.get<OrganizationApplication[]>("/superadmin/applications"),

  approveApplication: (id: number) => api.post(`/superadmin/applications/${id}/approve`),

  declineApplication: (id: number) => api.post(`/superadmin/applications/${id}/decline`),
};
