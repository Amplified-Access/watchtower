import type { DatasetUploadInput } from "../../domain/dataset";
import type { DatasetsRepository } from "../../domain/datasets-repository";

export class UploadDataset {
  constructor(private readonly repository: DatasetsRepository) {}

  async execute(input: DatasetUploadInput) {
    const dataset = await this.repository.uploadDataset(input);
    return {
      success: true,
      message: "Dataset uploaded successfully",
      dataset,
    };
  }
}
