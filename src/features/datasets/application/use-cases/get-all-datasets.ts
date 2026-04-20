import type { AdminDatasetFilterInput } from "../../domain/dataset";
import type { DatasetsRepository } from "../../domain/datasets-repository";

export class GetAllDatasets {
  constructor(private readonly repository: DatasetsRepository) {}

  async execute(input: AdminDatasetFilterInput) {
    const result = await this.repository.getAllDatasets(input);

    return {
      data: result.data,
      pagination: {
        page: input.page,
        limit: input.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / input.limit),
      },
    };
  }
}
