import "server-only";
import { cache } from "react";
import { sanityFetch } from "./live";
import {
  CASE_STUDIES_QUERY,
  CASE_STUDY_CATEGORIES_QUERY,
  CASE_STUDY_QUERY,
  LEGAL_PAGE_QUERY,
} from "./queries";
import type { CaseStudy, CaseStudyCategory, CaseStudySummary, LegalPage } from "./types";

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
