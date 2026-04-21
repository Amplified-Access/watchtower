import type { DatasetFilterInput } from "../../domain/dataset";
import type { DatasetsRepository } from "../../domain/datasets-repository";

export class GetPublicDatasets {
  constructor(private readonly repository: DatasetsRepository) {}

  async execute(input: DatasetFilterInput) {
    const result = await this.repository.getPublicDatasets(input);

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
