import type { MetadataRoute } from "next";
import { generateIncidentTypeSlug } from "@/features/maps/application/use-cases/generate-incident-type-slug";
import { incidentsApi } from "@/lib/api/incidents";
import { getSitemapContent } from "@/lib/sanity/content";
import { abs, SITE } from "@/lib/seo/site";

/**
 * /sitemap.xml: every public, indexable page, read from where the site gets
 * them, so it never lists a page that doesn't exist or misses a new one.
 * Case studies and the Sanity pages carry the date they last changed; the
 * code-built pages carry none rather than a made-up one. Thematic maps are
 * one per active incident type in the Go API.
 *
 * Left out: the Studio, the API, dashboards, password reset and chat threads
 * (see robots.ts), and the older Insights, Reports, Datasets and
 * Organisations pages. Those load their content in the browser, which most
 * AI crawlers don't run; they still have their own titles (their layouts)
 * and are reachable from the footer.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [content, incidentTypes] = await Promise.all([
    getSitemapContent(),
    // The sitemap is still useful without the API, so a failure leaves the maps out.
    incidentsApi
      .getAllTypes(true)
      .then((res) => res.data ?? [])
      .catch(() => []),
  ]);
  const updated = (id: string) => content.pages.find((page) => page._id === id)?.updatedAt;

  const page = (
    path: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
    lastModified?: string,
  ): MetadataRoute.Sitemap[number] => ({ url: abs(path), priority, changeFrequency, lastModified });

  return [
    // The origin without a trailing slash, exactly as the home page's canonical URL.
    { ...page("/", 1, "weekly", updated("homePage")), url: SITE.url },
    page("/anonymous-reports", 0.9, "monthly"),
    page("/maps", 0.9, "weekly"),
    page("/maps/live-incident-map", 0.9, "daily"),
    page("/about", 0.8, "monthly", updated("aboutPage")),
    page("/case-studies", 0.8, "weekly"),
    page("/alerts", 0.7, "monthly"),
    page("/chat", 0.6, "monthly"),
    page("/register-organization", 0.5, "yearly"),
    page("/privacy-policy", 0.3, "yearly", updated("privacyPolicy")),
    page("/terms-of-use", 0.3, "yearly", updated("termsOfUse")),
    page("/security", 0.3, "yearly", updated("security")),
    page("/code-of-conduct", 0.3, "yearly", updated("codeOfConduct")),
    ...content.caseStudies.map((study) => page(`/case-studies/${study.slug}`, 0.7, "monthly", study.updatedAt)),
    ...incidentTypes.map((type) => page(`/maps/${generateIncidentTypeSlug(type.name)}`, 0.6, "daily")),
  ];
}
