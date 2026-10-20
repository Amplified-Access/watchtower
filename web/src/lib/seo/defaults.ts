// English search titles and descriptions, written for search results. Editors
// change and translate them in the Studio ("Search and sharing"); these are
// what the seed puts there in English, and what the site shows when Sanity
// has nothing (not configured, or the field is empty in every language).
//
// Titles leave out "WatchTower": the site adds " | WatchTower".
// Imported by the Sanity seed (sanity/seed/), so no `@/` imports here.
import { SITE } from "./site";

export type SeoText = { title: string; description: string };

/** The pages whose content is code, not a Sanity document: their search text lives in the `seoSettings` document. */
export const SEO_PAGE_KEYS = [
  "caseStudies",
  "maps",
  "liveMap",
  "thematicMap",
  "report",
  "alerts",
  "chat",
  "registerOrganization",
  "signIn",
] as const;
export type SeoPageKey = (typeof SEO_PAGE_KEYS)[number];

export const DEFAULT_PAGE_SEO: Record<SeoPageKey, SeoText> = {
  caseStudies: {
    title: "Case studies",
    description:
      "Stories from communities using WatchTower: how local reports, in local languages, build evidence and understanding of what is happening on the ground.",
  },
  maps: {
    title: "Incident maps",
    description:
      "Explore interactive maps of community-reported civic incidents and rights violations, by place, incident type, language and time.",
  },
  liveMap: {
    title: "Live incident map",
    description:
      "Follow civic incidents as they are reported, mapped across places, incident types, languages and time.",
  },
  thematicMap: {
    title: "{type} map",
    description: "Explore community reports of {type} on an interactive map, by place and over time.",
  },
  report: {
    title: "Report an incident",
    description:
      "Report a civic incident or rights violation anonymously, by voice or text, in your own language. No account and no personal details needed.",
  },
  alerts: {
    title: "Incident alerts",
    description:
      "Subscribe to email alerts about civic incidents reported in the places and incident types you care about.",
  },
  chat: {
    title: "Ask WatchTower",
    description:
      "Ask questions about WatchTower and the incidents it has mapped, and get answers drawn from community reports.",
  },
  registerOrganization: {
    title: "Create a deployment",
    description:
      "Register your organisation to run WatchTower for your community: collect multilingual incident reports, map them and act on what they show.",
  },
  signIn: {
    title: "Sign in",
    description: "Sign in to your WatchTower organisation account.",
  },
};

/** The Home and About pages are Sanity documents with their own "Search and sharing" fields. */
export const DEFAULT_HOME_SEO: SeoText = {
  title: "Report civic incidents in your language",
  description: SITE.description,
};

export const DEFAULT_ABOUT_SEO: SeoText = {
  title: "About",
  description:
    "WatchTower is a community-centred, multilingual reporting and civic intelligence tool. Learn how it works, the languages it speaks and how it keeps reporters safe.",
};

/** The policy pages are Sanity documents; these cover them when Sanity has nothing. */
export const DEFAULT_SECURITY_SEO: SeoText = {
  title: "Security policy",
  description: "How to report a security vulnerability in WatchTower responsibly, what to include and how Amplified Access responds.",
};

export const DEFAULT_CODE_OF_CONDUCT_SEO: SeoText = {
  title: "Code of conduct",
  description:
    "The standards Amplified Access asks of everyone who contributes to or takes part in the WatchTower community, and how they are enforced.",
};

export const DEFAULT_TERMS_SEO: SeoText = {
  title: "Terms of use",
  description:
    "The rules for using WatchTower: reporting safely, what you can and can't submit, how reports are reviewed and shared, and the limits of the maps and AI features.",
};

export const DEFAULT_PRIVACY_SEO: SeoText = {
  title: "Privacy policy",
  description:
    "What information WatchTower collects when you report an incident, subscribe to alerts or use the site, how it is used and protected, and the choices you have.",
};
