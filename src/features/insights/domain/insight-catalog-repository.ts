import type {
  CreateInsightInput,
  GetPublicInsightsInput,
  InsightTagItem,
  PublicInsightDetails,
  PublicInsightListItem,
} from "./insight-catalog-types";

export interface InsightCatalogRepository {
  getPublicInsights(input: GetPublicInsightsInput): Promise<PublicInsightListItem[]>;

  getPublicInsightBySlug(slug: string): Promise<Omit<PublicInsightDetails, "tags"> | null>;

  getInsightTagsByInsightId(insightId: string): Promise<InsightTagItem[]>;

  getInsightTags(): Promise<InsightTagItem[]>;

  createInsight(input: CreateInsightInput): Promise<{ insightId: string }>;

  attachTags(insightId: string, tagIds: string[]): Promise<void>;
}
