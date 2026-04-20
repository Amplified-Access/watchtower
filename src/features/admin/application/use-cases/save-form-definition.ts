import type { AdminUserManagementRepository } from "../../domain/admin-user-management-repository";
import type { SaveFormDefinitionInput } from "../../domain/admin-user-management-types";

export class SaveFormDefinition {
  constructor(private readonly repository: AdminUserManagementRepository) {}

  async execute(input: SaveFormDefinitionInput) {
    await this.repository.saveFormDefinition(input);

    return {
      success: true,
      message: "Form definition saved successfully",
    };
  }
}
