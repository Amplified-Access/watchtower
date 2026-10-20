import { api } from "./client";
import type { IncidentType } from "./incidents";

export type DeploymentStatus = "draft" | "live" | "closed";

/** An organization's own map, as entity.Deployment serialises it. */
export interface Deployment {
  id: string;
  organizationId: string;
  organizationName?: string;
  name: string;
  slug: string;
  description?: string;
  country?: string;
  region?: string;
  status: DeploymentStatus;
  startsAt?: string;
  endsAt?: string;
  incidentTypes: IncidentType[];
  createdAt: string;
  updatedAt: string;
}

/** What an admin submits to create a deployment (entity.NewDeployment). */
export interface NewDeployment {
  name: string;
  description?: string;
  country?: string;
  region?: string;
  status?: DeploymentStatus;
  /** RFC 3339 */
  startsAt?: string;
  /** RFC 3339 */
  endsAt?: string;
  incidentTypeIds: string[];
}

/** How many deployments there are, by status (entity.DeploymentCounts). */
export interface DeploymentCounts {
  total: number;
  draft: number;
  live: number;
  closed: number;
}

export const deploymentsApi = {
  // The admin's own organization's, from their session.
  getOrganizationDeployments: () => api.get<Deployment[]>("/admin/deployments"),

  getOrganizationCounts: () => api.get<DeploymentCounts>("/admin/deployments/counts"),

  create: (data: NewDeployment) => api.post<Deployment>("/admin/deployments", data),

  // Super admin: every deployment, or one organization's.
  getAll: (organizationId?: string) =>
    api.get<Deployment[]>(
      `/superadmin/deployments${
        organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : ""
      }`
    ),
};
