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

// Body content for the detail page, in reading order.
export type CaseStudyBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "subheading"; text: string }
  | { type: "quote"; text: string }
  | { type: "image"; src: string; alt: string }
  | { type: "stats"; items: { value: string; unit?: string; label: string }[] }
  | { type: "mapLink"; href: string };

export interface CaseStudy {
  slug: string;
  title: string;
  summary: string;
  category: CaseStudyCategory;
  location: string;
  publishedAt: string;
  imageUrl: string;
  imageAlt: string;
  /** Deployment the study came from, shown in the detail page meta line. */
  deployment?: string;
  /** Full write-up. Studies without one show their summary as the introduction. */
  body?: CaseStudyBlock[];
  /** Shown in the featured block above the filters instead of the main list. */
  featured?: boolean;
}

export const CASE_STUDY_CATEGORIES: CaseStudyCategory[] = [
  "climate",
  "water-sanitation",
  "rights-safety",
  "public-services",
];

export const getCaseStudyBySlug = (slug: string) =>
  PLACEHOLDER_CASE_STUDIES.find((caseStudy) => caseStudy.slug === slug);

// Same category first, then the most recent others.
export const getRelatedCaseStudies = (caseStudy: CaseStudy, limit = 2) =>
  [...PLACEHOLDER_CASE_STUDIES]
    .filter((other) => other.slug !== caseStudy.slug)
    .sort(
      (a, b) =>
        Number(b.category === caseStudy.category) - Number(a.category === caseStudy.category) ||
        b.publishedAt.localeCompare(a.publishedAt),
    )
    .slice(0, limit);

const COMMUNITY_IMAGE = {
  imageUrl: "/case-studies/placeholder-community.webp",
  imageAlt: "Brightly painted houses stacked across a hillside",
};

const MARKET_IMAGE = {
  imageUrl: "/case-studies/placeholder-market.webp",
  imageAlt: "A crowded market street at sunset",
};

const CHILDREN_IMAGE = {
  imageUrl: "/case-studies/placeholder-children.webp",
  imageAlt: "Two smiling children standing in front of a corrugated metal wall",
};

export const PLACEHOLDER_CASE_STUDIES: CaseStudy[] = [
  {
    slug: "water-access-kampala",
    featured: true,
    title: "When access to water becomes uncertain",
    summary: "Listening to what communities are reporting about water access in Kampala",
    category: "water-sanitation",
    location: "Kampala, Uganda",
    deployment: "Community Water Watch",
    publishedAt: "2026-09-10",
    ...MARKET_IMAGE,
    body: [
      { type: "heading", text: "Introduction" },
      {
        type: "paragraph",
        text: "Across communities in Kampala, access to water can change from one day to the next. Interruptions, unreliable supply and concerns about water quality can affect households differently depending on where they live and the services available to them.",
      },
      {
        type: "paragraph",
        text: "Through Community Water Watch, WatchTower provides a way for people to report these experiences in the languages they are most comfortable using, helping individual accounts become part of a broader picture of what communities are experiencing.",
      },
      { type: "quote", text: "We sometimes go days without knowing when the water will return." },
      {
        type: "paragraph",
        text: "One report captures one person's experience. But when similar reports begin appearing across different places and at different times, they can reveal something more.",
      },
      {
        type: "paragraph",
        text: "Community Water Watch was created to bring these experiences together and make them easier to understand.",
      },
      { type: "heading", text: "Hearing what the numbers can miss" },
      {
        type: "paragraph",
        text: "Traditional data can tell us a great deal about infrastructure and service delivery. But it may not always capture what unreliable access feels like at household and community level.",
      },
      {
        type: "paragraph",
        text: "People describe the days without water, the distances travelled to find alternatives, changes in water quality and the ways interruptions affect everyday life.",
      },
      {
        type: "paragraph",
        text: "Community reporting creates another layer of evidence, one grounded in what people are seeing and experiencing themselves.",
      },
      { type: "image", src: MARKET_IMAGE.imageUrl, alt: MARKET_IMAGE.imageAlt },
      { type: "heading", text: "How we listened" },
      {
        type: "paragraph",
        text: "Community Water Watch used WatchTower to make reporting accessible across languages and locations.",
      },
      { type: "subheading", text: "Reporting in familiar languages:" },
      {
        type: "paragraph",
        text: "People could submit reports in the languages they were most comfortable using, reducing the need for communities to translate their experiences before sharing them.",
      },
      { type: "subheading", text: "Voice and text reporting:" },
      {
        type: "paragraph",
        text: "Reports could be shared through text or voice, giving people different ways to describe what was happening.",
      },
      { type: "subheading", text: "Translation and organisation:" },
      {
        type: "paragraph",
        text: "WatchTower helped transcribe, translate and organise reports so that information submitted in different languages could be understood together.",
      },
      { type: "subheading", text: "Connecting related reports:" },
      {
        type: "paragraph",
        text: "Reports could then be explored across location, time and incident type, helping recurring reporting patterns become easier to identify.",
      },
      { type: "subheading", text: "Privacy by design:" },
      {
        type: "paragraph",
        text: "Personal information and precise locations can be limited or generalised where necessary to help protect people submitting reports.",
      },
      { type: "heading", text: "A picture began to emerge" },
      {
        type: "paragraph",
        text: "As reports accumulated, individual experiences started to connect.",
      },
      {
        type: "stats",
        items: [
          { value: "42", label: "Related reports" },
          { value: "08", label: "Communities" },
          { value: "03", label: "Languages" },
          { value: "06", unit: "months", label: "Reporting period" },
        ],
      },
      { type: "heading", text: "Where reports came from" },
      {
        type: "paragraph",
        text: "Reports were submitted from communities across Kampala, with concentrations of reporting around water availability, service interruptions and water quality.",
      },
      { type: "mapLink", href: "/maps/live-incident-map" },
      { type: "heading", text: "From evidence to action" },
      {
        type: "paragraph",
        text: "Listening is only useful if what communities share can inform what happens next.",
      },
      {
        type: "paragraph",
        text: "The evidence generated through Community Water Watch can support conversations between communities, organisations and other stakeholders working on water access.",
      },
      {
        type: "paragraph",
        text: "Reports can provide additional context for investigation, advocacy, planning, coordination and accountability.",
      },
      { type: "heading", text: "Why it matters" },
      {
        type: "paragraph",
        text: "The people closest to an incident often understand dimensions of it that aggregate numbers alone cannot show.",
      },
      {
        type: "paragraph",
        text: "Community reporting provides a way to capture those experiences as they happen.",
      },
      {
        type: "paragraph",
        text: "When people can report in their own languages and those reports can be understood, connected and explored together, individual voices can contribute to a clearer understanding of what is happening on the ground.",
      },
    ],
  },
  {
    slug: "changing-seasons-everyday-life",
    featured: true,
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
      "Multilingual reporting surfaces incidents that would otherwise go unrecorded.",
    category: "rights-safety",
    location: "Pakistan",
    publishedAt: "2026-07-29",
    ...COMMUNITY_IMAGE,
  },
];

export const FEATURED_CASE_STUDIES = PLACEHOLDER_CASE_STUDIES.filter(
  (caseStudy) => caseStudy.featured,
);

// Everything the filtered list shows: featured studies already appear above it.
export const LISTED_CASE_STUDIES = PLACEHOLDER_CASE_STUDIES.filter(
  (caseStudy) => !caseStudy.featured,
);
