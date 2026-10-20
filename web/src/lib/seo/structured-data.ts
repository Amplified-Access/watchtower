// JSON-LD (schema.org) for every public page, read by search engines and AI
// assistants to understand what the site is, who runs it and what each page
// holds.
//
// Each page renders one `@graph` whose nodes point at each other by `@id`:
// the WebSite (WatchTower) is published by the Organization (Amplified
// Access), and every WebPage is part of the WebSite. The Organization's `@id`
// is the one amplifiedaccess.org uses for itself, so the two sites describe
// one publisher rather than two.
//
// Types are kept to ones Google's Rich Results Test validates without errors:
// Organization, WebSite, WebPage and its subtypes, FAQPage, BreadcrumbList,
// ItemList and Article. SoftwareApplication is left out on purpose: Google
// requires ratings and an offer for it, which a free civic tool doesn't have.
// The open-source code is described as SoftwareSourceCode instead.
import { locales } from "@/i18n/locales";
import type { CaseStudy, CaseStudySummary, FaqItem } from "@/lib/sanity/types";
import { abs, PUBLISHER, SITE } from "./site";

type Node = Record<string, unknown>;

export const ORGANIZATION_ID = `${PUBLISHER.url}/#organization`;
export const WEBSITE_ID = `${SITE.url}/#website`;
const SOURCE_ID = `${SITE.url}/#source-code`;

/** Wraps nodes in a schema.org `@graph` document. */
export const graph = (nodes: Node[]): Node => ({ "@context": "https://schema.org", "@graph": nodes });

export const organizationNode = (): Node => ({
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: PUBLISHER.name,
  url: `${PUBLISHER.url}/`,
  email: PUBLISHER.email,
  logo: { "@type": "ImageObject", url: PUBLISHER.logo },
  sameAs: [...PUBLISHER.sameAs],
});

export const websiteNode = (description: string): Node => ({
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  url: abs("/"),
  name: SITE.name,
  alternateName: "Watchtower",
  description,
  image: abs(SITE.image),
  publisher: { "@id": ORGANIZATION_ID },
  // Every language the site is offered in (BCP 47 codes).
  inLanguage: [...locales],
});

export const sourceCodeNode = (): Node => ({
  "@type": "SoftwareSourceCode",
  "@id": SOURCE_ID,
  name: SITE.name,
  description: "The open-source code of WatchTower: a Go API and a Next.js web app.",
  codeRepository: SITE.repository,
  license: SITE.license,
  programmingLanguage: ["Go", "TypeScript"],
  author: { "@id": ORGANIZATION_ID },
  isPartOf: { "@id": WEBSITE_ID },
});

type WebPageType = "WebPage" | "AboutPage" | "CollectionPage" | "ContactPage";

export type WebPageOptions = {
  path: string;
  name: string;
  description: string;
  locale: string;
  type?: WebPageType;
  /** Share image URL (absolute or a site path). */
  image?: string | null;
  /** Links the page to its BreadcrumbList; pass the same trail to breadcrumbNode. */
  breadcrumb?: boolean;
  /** Questions answered on the page: it becomes an FAQPage as well. */
  faqs?: FaqItem[];
  dateModified?: string;
};

export const webPageNode = ({
  path,
  name,
  description,
  locale,
  type = "WebPage",
  image,
  breadcrumb,
  faqs,
  dateModified,
}: WebPageOptions): Node => {
  const url = abs(path);
  const questions = (faqs ?? []).filter((faq) => faq.question && faq.answer);
  return {
    "@type": questions.length > 0 ? [type, "FAQPage"] : type,
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    isPartOf: { "@id": WEBSITE_ID },
    publisher: { "@id": ORGANIZATION_ID },
    inLanguage: locale,
    ...(image && { primaryImageOfPage: { "@type": "ImageObject", url: abs(image) } }),
    ...(breadcrumb && { breadcrumb: { "@id": `${url}#breadcrumb` } }),
    ...(dateModified && { dateModified }),
    ...(questions.length > 0 && {
      mainEntity: questions.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    }),
  };
};

export type Crumb = { name: string; path: string };

/** The trail from the home page to `path`; the last crumb is the page itself. */
export const breadcrumbNode = (path: string, trail: Crumb[]): Node => ({
  "@type": "BreadcrumbList",
  "@id": `${abs(path)}#breadcrumb`,
  itemListElement: trail.map((crumb, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: crumb.name,
    item: abs(crumb.path),
  })),
});

// ── Page graphs ──────────────────────────────────────────────────────────────

export type PageGraphOptions = Omit<WebPageOptions, "breadcrumb"> & {
  /** The crumbs between Home and this page, e.g. Case studies for a case study. */
  parents?: Crumb[];
  /** More nodes about the page's content (an Article, an ItemList). */
  extra?: Node[];
  /** The site's description, for the WebSite node. */
  siteDescription: string;
  /** "Home" in the page's language, for the first crumb. */
  homeName?: string;
};

/** The graph of any page but the home page: site, publisher, page and breadcrumbs. */
export const pageGraph = ({ parents = [], extra = [], siteDescription, homeName = "Home", ...page }: PageGraphOptions): Node =>
  graph([
    organizationNode(),
    websiteNode(siteDescription),
    webPageNode({ ...page, breadcrumb: true }),
    breadcrumbNode(page.path, [{ name: homeName, path: "/" }, ...parents, { name: page.name, path: page.path }]),
    ...extra,
  ]);

/** The home page also introduces the open-source code and answers its questions. */
export const homeGraph = ({
  siteDescription,
  ...page
}: Omit<WebPageOptions, "path" | "type" | "breadcrumb"> & { siteDescription: string }): Node =>
  graph([
    organizationNode(),
    websiteNode(siteDescription),
    sourceCodeNode(),
    webPageNode({ ...page, path: "/" }),
  ]);

/** The case studies, in the order the listing shows them. */
export const caseStudyListNode = (name: string, caseStudies: CaseStudySummary[]): Node => ({
  "@type": "ItemList",
  "@id": `${abs("/case-studies")}#list`,
  name,
  numberOfItems: caseStudies.length,
  itemListElement: caseStudies.map((study, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: abs(`/case-studies/${study.slug}`),
    name: study.title,
  })),
});

/** A case study as an Article, published by Amplified Access. */
export const caseStudyArticleNode = (study: CaseStudy, image: string | null): Node => {
  const url = abs(`/case-studies/${study.slug}`);
  return {
    "@type": "Article",
    "@id": `${url}#article`,
    headline: study.title,
    description: study.summary,
    url,
    mainEntityOfPage: { "@id": `${url}#webpage` },
    image: abs(image || SITE.image),
    datePublished: study.publishedAt,
    dateModified: study.updatedAt || study.publishedAt,
    author: { "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
    inLanguage: study.bodyLanguage,
    isAccessibleForFree: true,
    ...(study.category?.title && { articleSection: study.category.title }),
    ...(study.location && { contentLocation: { "@type": "Place", name: study.location } }),
  };
};
