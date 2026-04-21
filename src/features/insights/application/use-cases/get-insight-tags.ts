import type { InsightCatalogRepository } from "../../domain/insight-catalog-repository";
import type { InsightTagItem } from "../../domain/insight-catalog-types";

export class GetInsightTags {
  constructor(private readonly repository: InsightCatalogRepository) {}

  async execute(): Promise<InsightTagItem[]> {
    return this.repository.getInsightTags();
  }
}
