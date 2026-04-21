import { db } from "@/db";
import {
  insights,
  insightTagRelations,
  insightTags,
} from "@/db/schemas/insights";
import { organizations } from "@/db/schemas/organizations";
import { user } from "@/db/schemas/auth";
import { and, desc, eq, ilike } from "drizzle-orm";
import type { InsightCatalogRepository } from "../../domain/insight-catalog-repository";
import type {
  CreateInsightInput,
  GetPublicInsightsInput,
  InsightTagItem,
  PublicInsightDetails,
  PublicInsightListItem,
} from "../../domain/insight-catalog-types";

export class DrizzleInsightCatalogRepository implements InsightCatalogRepository {
  async getPublicInsights(
    input: GetPublicInsightsInput,
  ): Promise<PublicInsightListItem[]> {
    const whereConditions = [eq(insights.status, "published")];

    if (input.search) {
      whereConditions.push(ilike(insights.title, `%${input.search}%`));
    }

    let query = db
      .select({
        id: insights.id,
        title: insights.title,
        slug: insights.slug,
        description: insights.description,
        imageUrl: insights.imageUrl,
        imageAlt: insights.imageAlt,
        publishedAt: insights.publishedAt,
        createdAt: insights.createdAt,
        authorName: user.name,
        organizationName: organizations.name,
      })
      .from(insights)
      .leftJoin(user, eq(insights.authorId, user.id))
      .leftJoin(organizations, eq(insights.organizationId, organizations.id))
      .where(and(...whereConditions))
      .orderBy(desc(insights.publishedAt))
      .limit(input.limit)
      .offset(input.offset);

    if (input.tagId) {
      query = db
        .select({
          id: insights.id,
          title: insights.title,
          slug: insights.slug,
          description: insights.description,
          imageUrl: insights.imageUrl,
          imageAlt: insights.imageAlt,
          publishedAt: insights.publishedAt,
          createdAt: insights.createdAt,
          authorName: user.name,
          organizationName: organizations.name,
        })
        .from(insights)
        .leftJoin(user, eq(insights.authorId, user.id))
        .leftJoin(organizations, eq(insights.organizationId, organizations.id))
        .innerJoin(insightTagRelations, eq(insights.id, insightTagRelations.insightId))
        .where(and(...whereConditions, eq(insightTagRelations.tagId, input.tagId)))
        .orderBy(desc(insights.publishedAt))
        .limit(input.limit)
        .offset(input.offset);
    }

    return query;
  }

  async getPublicInsightBySlug(
    slug: string,
  ): Promise<Omit<PublicInsightDetails, "tags"> | null> {
    const [insight] = await db
      .select({
        id: insights.id,
        title: insights.title,
        slug: insights.slug,
        description: insights.description,
        content: insights.content,
        imageUrl: insights.imageUrl,
        imageAlt: insights.imageAlt,
        publishedAt: insights.publishedAt,
        createdAt: insights.createdAt,
        authorName: user.name,
        authorEmail: user.email,
        organizationName: organizations.name,
      })
      .from(insights)
      .leftJoin(user, eq(insights.authorId, user.id))
      .leftJoin(organizations, eq(insights.organizationId, organizations.id))
      .where(and(eq(insights.slug, slug), eq(insights.status, "published")))
      .limit(1);

    return insight ?? null;
  }

  async getInsightTagsByInsightId(insightId: string): Promise<InsightTagItem[]> {
    return db
      .select({
        id: insightTags.id,
        title: insightTags.title,
        slug: insightTags.slug,
      })
      .from(insightTags)
      .innerJoin(insightTagRelations, eq(insightTags.id, insightTagRelations.tagId))
      .where(eq(insightTagRelations.insightId, insightId));
  }

  async getInsightTags(): Promise<InsightTagItem[]> {
    return db
      .select({
        id: insightTags.id,
        title: insightTags.title,
        slug: insightTags.slug,
      })
      .from(insightTags)
      .orderBy(insightTags.title);
  }

  async createInsight(input: CreateInsightInput): Promise<{ insightId: string }> {
    const [newInsight] = await db
      .insert(insights)
      .values({
        title: input.title,
        slug: input.slug,
        description: input.description,
        content: input.content,
        imageUrl: input.imageUrl,
        imageAlt: input.imageAlt,
        authorId: input.actor.userId,
        organizationId: input.actor.organizationId ?? null,
        status: input.status,
        publishedAt: input.status === "published" ? new Date() : null,
      })
      .returning({ id: insights.id });

    return { insightId: newInsight.id };
  }

  async attachTags(insightId: string, tagIds: string[]): Promise<void> {
    if (tagIds.length === 0) {
      return;
    }

    await db.insert(insightTagRelations).values(
      tagIds.map((tagId) => ({
        insightId,
        tagId,
      })),
    );
  }
}
