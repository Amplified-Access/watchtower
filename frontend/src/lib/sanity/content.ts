import "server-only";
import { cache } from "react";
import { sanityFetch } from "./live";
import {
  ABOUT_PAGE_QUERY,
  CASE_STUDIES_QUERY,
  CASE_STUDY_CATEGORIES_QUERY,
  CASE_STUDY_QUERY,
  HOME_PAGE_QUERY,
  LEGAL_PAGE_QUERY,
} from "./queries";
import type {
  AboutPageContent,
  CaseStudy,
  CaseStudyCategory,
  CaseStudySummary,
  HomePageContent,
  LegalPage,
  SharedHomeSections,
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

const EMPTY_HOME: HomePageContent = {
  ...EMPTY_SHARED_HOME,
  hero: { titleLine1: "", titleLine2: "", description: "", primaryCta: "", secondaryCta: "" },
  explore: { heading: "", description: "" },
  speakNaturally: { title: "", description: "", cta: "" },
  insights: { label: "", heading: "", description: "", cta: "", readStory: "", sampleTitles: [] },
  faqs: { label: "", heading: "", description: "", items: [] },
};

export const getHomePage = cache(
  async (locale: string) => (await sanityFetch<HomePageContent>(HOME_PAGE_QUERY, { locale })) ?? EMPTY_HOME,
);

type AboutQueryResult = { about: Omit<AboutPageContent, "home"> | null; home: SharedHomeSections | null };

export const getAboutPage = cache(async (locale: string): Promise<AboutPageContent> => {
  const result = await sanityFetch<AboutQueryResult>(ABOUT_PAGE_QUERY, { locale });
  return {
    hero: { title: "", description: "", objective: "" },
    languages: { heading: "", description: "" },
    safety: { title: "", description: "", items: [] },
    cta: { title: "", description: "", primaryCta: "", secondaryCta: "" },
    ...result?.about,
    home: result?.home ?? EMPTY_SHARED_HOME,
  };
});
