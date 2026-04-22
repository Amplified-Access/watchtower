export interface Form {
  id: string;
  organizationId: string;
  name: string;
  definition: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
