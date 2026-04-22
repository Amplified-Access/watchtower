export type InsightStatus = "draft" | "published";

export interface InsightActorContext {
  userId: string;
  role: string;
  organizationId?: string | null;
}

export interface GetPublicInsightsInput {
  limit: number;
  offset: number;
  search?: string;
  tagId?: string;
}

export interface InsightTagItem {
  id: string;
  title: string;
  slug: string;
}

export interface PublicInsightListItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  imageAlt: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  authorName: string | null;
  organizationName: string | null;
}

export interface PublicInsightDetails extends PublicInsightListItem {
  content: unknown;
  authorEmail: string | null;
  tags: InsightTagItem[];
}

export interface CreateInsightInput {
  title: string;
  slug: string;
  description: string;
  content?: unknown;
  imageUrl?: string;
  imageAlt?: string;
  tagIds: string[];
  status: InsightStatus;
  actor: InsightActorContext;
}
