import type { InsightCatalogRepository } from "../../domain/insight-catalog-repository";
import type { PublicInsightDetails } from "../../domain/insight-catalog-types";
import {
  InsightNotFoundError,
  InsightValidationError,
} from "../../domain/errors";

export class GetPublicInsightBySlug {
  constructor(private readonly repository: InsightCatalogRepository) {}

  async execute(slug: string): Promise<PublicInsightDetails> {
    if (!slug.trim()) {
      throw new InsightValidationError("Slug is required");
    }

    const insight = await this.repository.getPublicInsightBySlug(slug);
    if (!insight) {
      throw new InsightNotFoundError("Insight not found");
    }

    const tags = await this.repository.getInsightTagsByInsightId(insight.id);

    return {
      ...insight,
      tags,
    };
  }
}
