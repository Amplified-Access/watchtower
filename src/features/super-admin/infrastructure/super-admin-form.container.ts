import { DeleteFormForSuperAdmin } from "../application/use-cases/delete-form-for-super-admin";
import { GetAllFormsForSuperAdmin } from "../application/use-cases/get-all-forms-for-super-admin";
import { GetFormByIdForSuperAdmin } from "../application/use-cases/get-form-by-id-for-super-admin";
import { UpdateFormForSuperAdmin } from "../application/use-cases/update-form-for-super-admin";
import type { SuperAdminFormRepository } from "../domain/super-admin-form-repository";
import { DrizzleSuperAdminFormRepository } from "./repositories/drizzle-super-admin-form-repository";

export interface SuperAdminFormUseCases {
  getAllFormsForSuperAdmin: GetAllFormsForSuperAdmin;
  getFormByIdForSuperAdmin: GetFormByIdForSuperAdmin;
  updateFormForSuperAdmin: UpdateFormForSuperAdmin;
  deleteFormForSuperAdmin: DeleteFormForSuperAdmin;
}

export const createSuperAdminFormUseCases = (
  repository: SuperAdminFormRepository = new DrizzleSuperAdminFormRepository(),
): SuperAdminFormUseCases => {
  return {
    getAllFormsForSuperAdmin: new GetAllFormsForSuperAdmin(repository),
    getFormByIdForSuperAdmin: new GetFormByIdForSuperAdmin(repository),
    updateFormForSuperAdmin: new UpdateFormForSuperAdmin(repository),
    deleteFormForSuperAdmin: new DeleteFormForSuperAdmin(repository),
  };
};
