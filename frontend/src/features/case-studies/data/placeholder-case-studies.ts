// PLACEHOLDER CONTENT — there is no case studies backend yet. These entries
// mirror the Figma so the page can be built and reviewed; replace this module
// with a tRPC query once case studies exist in the Go API. Titles and
// summaries are English-only on purpose: they stand in for CMS content, not UI
// copy, so they don't belong in messages/*.json.

export type CaseStudyCategory =
  | "climate"
  | "water-sanitation"
  | "rights-safety"
  | "public-services";

export interface CaseStudy {
  slug: string;
  title: string;
  summary: string;
  category: CaseStudyCategory;
  location: string;
  publishedAt: string;
  imageUrl: string;
  imageAlt: string;
}

export const CASE_STUDY_CATEGORIES: CaseStudyCategory[] = [
  "climate",
  "water-sanitation",
  "rights-safety",
  "public-services",
];

const COMMUNITY_IMAGE = {
  imageUrl: "/case-studies/placeholder-community.webp",
  imageAlt: "Brightly painted houses stacked across a hillside",
};

const CHILDREN_IMAGE = {
  imageUrl: "/case-studies/placeholder-children.webp",
  imageAlt: "Two smiling children standing in front of a corrugated metal wall",
};

export const PLACEHOLDER_CASE_STUDIES: CaseStudy[] = [
  {
    slug: "changing-seasons-everyday-life",
    title: "When changing seasons reshape everyday life",
    summary:
      "How community voices are helping build a clearer picture of changing climate conditions.",
    category: "climate",
    location: "Kenya",
    publishedAt: "2026-09-08",
    ...COMMUNITY_IMAGE,
  },
  {
    slug: "access-to-public-services",
    title: "What communities are telling us about access to public services",
    summary:
      "Connecting reports across places to understand recurring experiences and service gaps.",
    category: "public-services",
    location: "East Africa",
    publishedAt: "2026-09-08",
    ...CHILDREN_IMAGE,
  },
  {
    slug: "water-points-running-dry",
    title: "Tracking water points that run dry between rains",
    summary:
      "Reports from neighbouring villages reveal where water access breaks down first.",
    category: "water-sanitation",
    location: "Uganda",
    publishedAt: "2026-09-01",
    ...CHILDREN_IMAGE,
  },
  {
    slug: "safer-routes-to-market",
    title: "Mapping safer routes to the market",
    summary:
      "How repeated safety reports helped a community document where risks concentrate.",
    category: "rights-safety",
    location: "Tanzania",
    publishedAt: "2026-08-27",
    ...COMMUNITY_IMAGE,
  },
  {
    slug: "sanitation-in-growing-settlements",
    title: "Sanitation gaps in fast-growing settlements",
    summary:
      "Residents describe how infrastructure has not kept pace with new neighbourhoods.",
    category: "water-sanitation",
    location: "Kenya",
    publishedAt: "2026-08-19",
    ...COMMUNITY_IMAGE,
  },
  {
    slug: "clinic-waiting-times",
    title: "What reports reveal about clinic waiting times",
    summary:
      "Patterns across districts point to the services communities struggle to reach.",
    category: "public-services",
    location: "Rwanda",
    publishedAt: "2026-08-12",
    ...CHILDREN_IMAGE,
  },
  {
    slug: "floods-and-displacement",
    title: "Floods, displacement and the voices in between",
    summary:
      "Community accounts help explain how extreme weather disrupts daily routines.",
    category: "climate",
    location: "Ethiopia",
    publishedAt: "2026-08-04",
    ...CHILDREN_IMAGE,
  },
  {
    slug: "documenting-rights-concerns",
    title: "Documenting rights concerns in the languages people speak",
    summary:
      "Multilingual reporting surfaces issues that would otherwise go unrecorded.",
    category: "rights-safety",
    location: "Pakistan",
    publishedAt: "2026-07-29",
    ...COMMUNITY_IMAGE,
  },
];
