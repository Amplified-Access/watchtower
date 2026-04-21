import type { InsightCatalogRepository } from "../../domain/insight-catalog-repository";
import type {
  GetPublicInsightsInput,
  PublicInsightListItem,
} from "../../domain/insight-catalog-types";
import { InsightValidationError } from "../../domain/errors";

export class GetPublicInsights {
  constructor(private readonly repository: InsightCatalogRepository) {}

  async execute(input: GetPublicInsightsInput): Promise<PublicInsightListItem[]> {
    if (input.limit < 1 || input.limit > 100) {
      throw new InsightValidationError("Limit must be between 1 and 100");
    }

    if (input.offset < 0) {
      throw new InsightValidationError("Offset must be 0 or greater");
    }

    return this.repository.getPublicInsights(input);
  }
}
