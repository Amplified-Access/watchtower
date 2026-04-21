import type { DatasetsRepository } from "../../domain/datasets-repository";

export class GetDatasetById {
  constructor(private readonly repository: DatasetsRepository) {}

  async execute(id: string) {
    return this.repository.getDatasetById(id);
  }
}
