import type { DatasetsRepository } from "../../domain/datasets-repository";

export class IncrementDatasetDownload {
  constructor(private readonly repository: DatasetsRepository) {}

  async execute(id: string) {
    await this.repository.incrementDownload(id);
    return { success: true };
  }
}
