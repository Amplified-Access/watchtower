export interface GetPublicReportsInput {
  limit: number;
  offset: number;
  search?: string;
}

export type ReportStatus = "draft" | "published";
export type ReportFilterStatus = ReportStatus | "all";

export interface ReportActorContext {
  userId: string;
  role: string;
  organizationId?: string | null;
}

export interface CreateReportInput {
  title: string;
  fileKey: string;
  status: ReportStatus;
  organizationId: string;
  reportedById: string;
}

export interface OrganizationReportListItem {
  id: string;
  organizationId: string;
  reportedById: string;
  title: string;
  fileKey: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  authorName: string | null;
  authorEmail: string | null;
}

export interface OrganizationReportDetails extends OrganizationReportListItem {
  organizationName: string | null;
}

export interface GetOrganizationReportsInput {
  organizationId: string;
  status: ReportFilterStatus;
  limit: number;
  offset: number;
}

export interface OrganizationReportsResult {
  reports: OrganizationReportListItem[];
  totalCount: number;
  hasMore: boolean;
}

export interface UpdateReportInput {
  reportId: string;
  title?: string;
  status?: ReportStatus;
}

export interface PublicReportListItem {
  id: string;
  title: string;
  fileKey: string;
  createdAt: Date;
  updatedAt: Date;
  authorName: string | null;
  organizationName: string | null;
  organizationSlug: string | null;
}

export interface PublicReportDetails {
  id: string;
  title: string;
  fileKey: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  authorName: string | null;
  authorEmail: string | null;
  organizationName: string | null;
}
