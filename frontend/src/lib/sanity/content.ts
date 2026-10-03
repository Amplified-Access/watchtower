import "server-only";
import { cache } from "react";
import { defaultLocale } from "@/i18n/locales";
import { SEO_PAGE_KEYS } from "@/lib/seo/defaults";
import { sanityFetch } from "./live";
import {
  ABOUT_PAGE_QUERY,
  CASE_STUDIES_QUERY,
  CASE_STUDY_CATEGORIES_QUERY,
  CASE_STUDY_QUERY,
  HOME_PAGE_QUERY,
  LEGAL_PAGE_QUERY,
  LLMS_QUERY,
  SEO_SETTINGS_QUERY,
  SITEMAP_QUERY,
} from "./queries";
import type {
  AboutPageContent,
  CaseStudy,
  CaseStudyCategory,
  CaseStudySummary,
  HomePageContent,
  LegalPage,
  LlmsContent,
  Seo,
  SeoSettings,
  SharedHomeSections,
  SitemapContent,
} from "./types";

// `cache` dedupes calls within one request, e.g. generateMetadata and the
// page both asking for the same case study.

export const getCaseStudies = cache(
  async (locale: string) => (await sanityFetch<CaseStudySummary[]>(CASE_STUDIES_QUERY, { locale })) ?? [],
);

export const getCaseStudyCategories = cache(
  async (locale: string) =>
    (await sanityFetch<CaseStudyCategory[]>(CASE_STUDY_CATEGORIES_QUERY, { locale })) ?? [],
);

export const getCaseStudy = cache((slug: string, locale: string) =>
  sanityFetch<CaseStudy>(CASE_STUDY_QUERY, { slug, locale }),
);

export const getLegalPage = cache((id: string, locale: string) =>
  sanityFetch<LegalPage>(LEGAL_PAGE_QUERY, { id, locale }),
);

// Without Sanity (not configured, or a page not published yet) the pages
// still render, with their layout and no text, rather than failing.
const EMPTY_SHARED_HOME: SharedHomeSections = {
  stats: [],
  howItWorks: { heading: "", description: "", steps: [] },
  faqsLabel: "",
  impact: { title: "", description: "" },
  banner: { text: "", cta: "" },
};

const EMPTY_SEO: Seo = { title: "", description: "", image: null };

const EMPTY_HOME: HomePageContent = {
  ...EMPTY_SHARED_HOME,
  hero: { titleLine1: "", titleLine2: "", description: "", primaryCta: "", secondaryCta: "" },
  explore: { heading: "", description: "" },
  speakNaturally: { title: "", description: "", cta: "" },
  insights: { label: "", heading: "", description: "", cta: "", readStory: "", sampleTitles: [] },
  faqs: { label: "", heading: "", description: "", items: [] },
  seo: EMPTY_SEO,
};

export const getHomePage = cache(
  async (locale: string) => (await sanityFetch<HomePageContent>(HOME_PAGE_QUERY, { locale })) ?? EMPTY_HOME,
);

type AboutQueryResult = { about: Omit<AboutPageContent, "home"> | null; home: SharedHomeSections | null };

export const getAboutPage = cache(async (locale: string): Promise<AboutPageContent> => {
  const result = await sanityFetch<AboutQueryResult>(ABOUT_PAGE_QUERY, { locale });
  return {
    hero: { eyebrow: "", title: "" },
    approach: { eyebrow: "", heading: "", description: "" },
    steps: [],
    languages: { eyebrow: "", heading: "", description: "" },
    audiences: { eyebrow: "", heading: "", items: [] },
    safety: { title: "", description: "", items: [] },
    cta: { title: "", description: "", primaryCta: "", secondaryCta: "" },
    seo: EMPTY_SEO,
    ...result?.about,
    home: result?.home ?? EMPTY_SHARED_HOME,
  };
});

// The search and crawler content below is read by every route (the root
// layout) or by machine-facing routes (sitemap, llms.txt) that can still
// serve their static part. A Sanity outage therefore falls back to the
// defaults with a warning rather than failing them. Unlike the pages' own
// content, there is nothing on screen to break.
const orNull = <T>(fetch: Promise<T | null>, what: string) =>
  fetch.catch((error) => {
    console.warn(`[sanity] ${what} unavailable, using the defaults:`, error);
    return null;
  });

// The site's description and share image and the code-built pages' search
// text, with every page present so callers can fall back field by field to
// the English defaults.
export const getSeoSettings = cache(async (locale: string): Promise<SeoSettings> => {
  const result = await orNull(
    sanityFetch<Partial<SeoSettings>>(SEO_SETTINGS_QUERY, { locale }),
    "Search and sharing settings",
  );
  return {
    description: result?.description ?? "",
    image: result?.image ?? null,
    pages: Object.fromEntries(
      SEO_PAGE_KEYS.map((key) => [key, result?.pages?.[key] ?? EMPTY_SEO]),
    ) as SeoSettings["pages"],
  };
});

export const getSitemapContent = async (): Promise<SitemapContent> =>
  (await orNull(sanityFetch<SitemapContent>(SITEMAP_QUERY), "Sitemap content")) ?? { caseStudies: [], pages: [] };

// In English: llms.txt is read by machines, which get the base language.
export const getLlmsContent = async (): Promise<LlmsContent> =>
  (await orNull(sanityFetch<LlmsContent>(LLMS_QUERY, { locale: defaultLocale }), "llms.txt content")) ?? {
    home: null,
    about: null,
    caseStudies: [],
    policies: [],
  };
