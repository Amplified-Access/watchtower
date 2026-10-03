import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { insightsApi } from "@/lib/api/insights";
import { pageMetadata } from "@/lib/seo/metadata";
import { siteShareImage } from "@/lib/seo/page";

// The page loads the insight in the browser; its title, description and
// canonical URL are read here, on the server, from the same Go endpoint.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { data: insight } = await insightsApi.getPublicInsightBySlug(slug).catch(() => ({ data: null }));
  if (!insight) return {};
  const locale = await getLocale();
  return pageMetadata({
    path: `/insights/${insight.slug}`,
    title: insight.title,
    description: insight.description,
    locale,
    image: insight.imageUrl?.startsWith("https://") ? insight.imageUrl : await siteShareImage(locale),
    type: "article",
    publishedTime: insight.publishedAt,
    modifiedTime: insight.updatedAt,
  });
}

const InsightLayout = ({ children }: { children: React.ReactNode }) => children;

export default InsightLayout;
