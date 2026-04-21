import { CreateInsight } from "../application/use-cases/create-insight";
import { GetInsightTags } from "../application/use-cases/get-insight-tags";
import { GetPublicInsightBySlug } from "../application/use-cases/get-public-insight-by-slug";
import { GetPublicInsights } from "../application/use-cases/get-public-insights";
import type { InsightCatalogRepository } from "../domain/insight-catalog-repository";
import { DrizzleInsightCatalogRepository } from "./repositories/drizzle-insight-catalog-repository";

export interface InsightCatalogUseCases {
  getPublicInsights: GetPublicInsights;
  getPublicInsightBySlug: GetPublicInsightBySlug;
  getInsightTags: GetInsightTags;
  createInsight: CreateInsight;
}

export const createInsightCatalogUseCases = (
  repository: InsightCatalogRepository = new DrizzleInsightCatalogRepository(),
): InsightCatalogUseCases => {
  return {
    getPublicInsights: new GetPublicInsights(repository),
    getPublicInsightBySlug: new GetPublicInsightBySlug(repository),
    getInsightTags: new GetInsightTags(repository),
    createInsight: new CreateInsight(repository),
  };
};
