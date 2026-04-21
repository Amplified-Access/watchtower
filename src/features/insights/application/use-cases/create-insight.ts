import type { InsightCatalogRepository } from "../../domain/insight-catalog-repository";
import type { CreateInsightInput } from "../../domain/insight-catalog-types";

export class CreateInsight {
  constructor(private readonly repository: InsightCatalogRepository) {}

  async execute(input: CreateInsightInput) {
    const { insightId } = await this.repository.createInsight(input);

    if (input.tagIds.length > 0) {
      await this.repository.attachTags(insightId, input.tagIds);
    }

    return {
      success: true,
      message: "Insight created successfully",
      insightId,
    };
  }
}
