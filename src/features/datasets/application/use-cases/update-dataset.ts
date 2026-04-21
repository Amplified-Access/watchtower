import type { DatasetUpdateInput } from "../../domain/dataset";
import type { DatasetsRepository } from "../../domain/datasets-repository";

export class UpdateDataset {
  constructor(private readonly repository: DatasetsRepository) {}

  async execute(input: DatasetUpdateInput) {
    const dataset = await this.repository.updateDataset(input);
    return dataset;
  }
}
