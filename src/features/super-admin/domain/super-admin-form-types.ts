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
