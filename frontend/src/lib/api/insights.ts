import { api } from "./client";

export interface InsightTag {
  id: string;
  title: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface Insight {
  id: string;
  title: string;
  slug: string;
  description: string;
  content?: Record<string, unknown>;
  authorId: string;
  organizationId?: string;
  imageUrl?: string;
  imageAlt?: string;
  status: "draft" | "published";
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  authorName?: string;
  organizationName?: string;
  tags?: InsightTag[];
}

export interface ListParams {
  limit?: number;
  offset?: number;
  search?: string;
  sort?: string;
  sortOrder?: string;
}

export const insightsApi = {
  getPublicInsights: (params?: ListParams, tags?: string[]) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));
    if (params?.search) query.set("search", params.search);
    if (tags?.length) query.set("tags", tags.join(","));
    const qs = query.toString();
    return api.get<Insight[]>(`/insights${qs ? `?${qs}` : ""}`);
  },

  getPublicInsightBySlug: (slug: string) => api.get<Insight>(`/insights/${slug}`),

  getTags: () => api.get<InsightTag[]>("/insights/tags"),

  createInsight: (data: {
    title: string;
    slug: string;
    description: string;
    content?: Record<string, unknown>;
    imageUrl?: string;
    imageAlt?: string;
    status?: string;
    tagIds?: string[];
  }) => api.post("/admin/insights", data),
};
