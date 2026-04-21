export interface GetPublicReportsInput {
  limit: number;
  offset: number;
  search?: string;
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
