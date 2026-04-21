import type { DatasetsRepository } from "../../domain/datasets-repository";

export class GetDatasetCategories {
  constructor(private readonly repository: DatasetsRepository) {}

  async execute() {
    return this.repository.getCategoryStats();
  }
}
