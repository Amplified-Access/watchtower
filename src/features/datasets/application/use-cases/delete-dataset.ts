import type { DatasetsRepository } from "../../domain/datasets-repository";

export class DeleteDataset {
  constructor(private readonly repository: DatasetsRepository) {}

  async execute(id: string) {
    return this.repository.deleteDataset(id);
  }
}
