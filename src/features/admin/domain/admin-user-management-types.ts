export interface AdminActorContext {
  userId: string;
  role: string;
  organizationId?: string | null;
}

export interface OrganizationWatcher {
  id: string;
  name: string;
  email: string;
  role: string | null;
  organizationId: string | null;
  organization: string | null;
}

export interface InviteWatcherInput {
  name: string;
  email: string;
  organizationId?: string;
}

export interface ResetUserPasswordInput {
  userId: string;
  email: string;
  actor: AdminActorContext;
}

export interface BasicUserRecord {
  id: string;
  organizationId: string | null;
}

export interface AdminFormRecord {
  id: string;
  organizationId: string;
  name: string;
  definition: unknown;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminFormWithIncidentCount extends AdminFormRecord {
  incidentCount: number;
}

export interface SaveFormDefinitionInput {
  organizationId: string;
  title: string;
  definition: unknown;
}

export interface UpdateFormInput {
  formId: string;
  title: string;
  definition: unknown;
  isActive?: boolean;
  actor: AdminActorContext;
}

export interface DeleteFormInput {
  formId: string;
  actor: AdminActorContext;
}

export type AdminIncidentStatus =
  | "reported"
  | "investigating"
  | "resolved"
  | "closed";

export interface AdminIncidentRecord {
  id: string;
  organizationId: string;
  formId: string;
  reportedByUserId: string;
  data: unknown;
  status: AdminIncidentStatus;
  createdAt: Date;
  updatedAt: Date;
  formName: string | null;
  reporterEmail: string | null;
}

export interface GetOrganizationIncidentsInput {
  organizationId: string;
  search?: string;
  status?: AdminIncidentStatus;
  formId?: string;
  sortBy: "createdAt" | "updatedAt" | "status";
  sortOrder: "asc" | "desc";
  limit: number;
  offset: number;
  actor: AdminActorContext;
}

export interface GetIncidentByIdInput {
  incidentId: string;
  actor: AdminActorContext;
}

export interface UpdateIncidentStatusInput {
  incidentId: string;
  status: AdminIncidentStatus;
  actor: AdminActorContext;
}
