export interface SuperAdminFormRecord {
  id: string;
  organizationId: string;
  name: string;
  definition: unknown;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  organizationName?: string | null;
}

export interface SuperAdminFormWithIncidentCount extends SuperAdminFormRecord {
  incidentCount: number;
}

export interface GetAllFormsForSuperAdminInput {
  search?: string;
  organizationId?: string;
  isActive?: boolean;
  sortBy: "createdAt" | "updatedAt" | "name";
  sortOrder: "asc" | "desc";
  limit: number;
  offset: number;
}

export interface UpdateFormForSuperAdminInput {
  formId: string;
  name?: string;
  definition?: unknown;
  isActive?: boolean;
}

export type SuperAdminIncidentStatus =
  | "reported"
  | "investigating"
  | "resolved"
  | "closed";

export interface SuperAdminIncidentRecord {
  id: string;
  organizationId: string;
  formId: string;
  reportedByUserId: string;
  data: unknown;
  status: SuperAdminIncidentStatus;
  createdAt: Date;
  updatedAt: Date;
  formName: string | null;
  organizationName: string | null;
  reporterEmail: string | null;
}

export interface GetAllIncidentsForSuperAdminInput {
  search?: string;
  organizationId?: string;
  formId?: string;
  status?: SuperAdminIncidentStatus;
  sortBy: "createdAt" | "updatedAt" | "status";
  sortOrder: "asc" | "desc";
  limit: number;
  offset: number;
}

export interface UpdateIncidentStatusForSuperAdminInput {
  incidentId: string;
  status: SuperAdminIncidentStatus;
}

export type SuperAdminReportStatus = "draft" | "published";

export interface SuperAdminReportRecord {
  id: string;
  organizationId: string;
  reportedById: string;
  title: string;
  fileKey: string;
  status: SuperAdminReportStatus;
  createdAt: Date;
  updatedAt: Date;
  authorName: string | null;
  authorEmail: string | null;
  organizationName: string | null;
}

export interface GetAllReportsForSuperAdminInput {
  search?: string;
  organizationId?: string;
  status: SuperAdminReportStatus | "all";
  sortBy: "createdAt" | "updatedAt" | "title";
  sortOrder: "asc" | "desc";
  limit: number;
  offset: number;
}

export interface SuperAdminGrowthMetric {
  current: number;
  previous: number;
  percentage: number;
}

export interface SuperAdminDashboardStats {
  totalOrganizations: number;
  totalAdmins: number;
  totalWatchers: number;
  pendingApplications: number;
  reportsThisMonth: number;
  activeForms: number;
  criticalIncidents: number;
  uptimePercentage: number;
  growth: {
    organizations: SuperAdminGrowthMetric;
    admins: SuperAdminGrowthMetric;
    watchers: SuperAdminGrowthMetric;
  };
  metrics: {
    newOrganizationsThisMonth: number;
    newAdminsThisMonth: number;
    newWatchersThisMonth: number;
    averageReportsPerOrg: number;
  };
}
