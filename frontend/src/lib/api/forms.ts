export interface Form {
  id: string;
  organizationId: string;
  organizationName?: string;
  name: string;
  definition: Record<string, unknown>;
  incidentCount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
