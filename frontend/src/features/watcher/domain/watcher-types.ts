export interface ActorContext {
  userId: string;
  role: string;
  organizationId?: string | null;
}

export interface OrganizationDetails {
  organizationId: string | null;
  organization: string | null;
  description: string | null;
  website: string | null;
  location: string | null;
  contactEmail: string | null;
}

export interface WatcherForm {
  id: string;
  name: string;
  definition: unknown;
  createdAt: Date;
  updatedAt: Date;
  isActive?: boolean;
  organizationId?: string;
}

export interface DashboardStats {
  incidents: {
    total: number;
    open: number;
    investigating: number;
    resolved: number;
  };
  reports: {
    total: number;
    draft: number;
    published: number;
  };
  forms: {
    total: number;
    active: number;
  };
  watchers: {
    total: number;
  };
}

export interface RecentActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  type: "incident" | "report";
  status: string;
  href: string;
}

export interface SubmitIncidentInput {
  formId: string;
  data: Record<string, unknown>;
  organizationId: string;
  actor: ActorContext;
}
