import type {
  GetAllFormsForSuperAdminInput,
  SuperAdminFormRecord,
  SuperAdminFormWithIncidentCount,
  UpdateFormForSuperAdminInput,
} from "./super-admin-form-types";

export interface SuperAdminFormRepository {
  getAllForms(input: GetAllFormsForSuperAdminInput): Promise<{
    forms: SuperAdminFormWithIncidentCount[];
    totalCount: number;
    hasMore: boolean;
  }>;
  getFormById(formId: string): Promise<SuperAdminFormRecord | null>;
  updateForm(input: UpdateFormForSuperAdminInput): Promise<void>;
  getFormIncidentCount(formId: string): Promise<number>;
  deleteForm(formId: string): Promise<void>;
}
