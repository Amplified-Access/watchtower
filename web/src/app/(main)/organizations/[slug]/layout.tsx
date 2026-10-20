import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { organizationsApi } from "@/lib/api/organizations";
import { pageMetadata } from "@/lib/seo/metadata";
import { siteShareImage } from "@/lib/seo/page";

// The page loads the organisation in the browser; its name, description and
// canonical URL are read here, on the server, from the same Go endpoint.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { data: organization } = await organizationsApi.getBySlug(slug).catch(() => ({ data: null }));
  if (!organization) return {};
  const locale = await getLocale();
  return pageMetadata({
    path: `/organizations/${organization.slug}`,
    title: organization.name,
    description: organization.description || [organization.name, organization.location].filter(Boolean).join(", "),
    locale,
    image: await siteShareImage(locale),
  });
}

const OrganizationLayout = ({ children }: { children: React.ReactNode }) => children;

export default OrganizationLayout;
