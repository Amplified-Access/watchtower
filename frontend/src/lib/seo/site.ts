// The facts about the site that search engines, link previews, structured
// data and llms.txt all repeat. One place, so they never disagree.
//
// Imported by the Sanity seed (sanity/seed/), so no `@/` imports here.

export const SITE = {
  name: "WatchTower",
  /** The production origin, used for every canonical URL. The apex redirects here. */
  url: "https://www.thewatchtower.tech",
  /** The home page's title. Every other page is "<title> | WatchTower". */
  title: "WatchTower | Report civic incidents in your language",
  description:
    "Report civic incidents and rights violations anonymously, by voice or text, in your own language. WatchTower maps the reports to reveal patterns and drive action.",
  /** The generated share image (src/app/og-image.png/route.tsx), 1200 by 630. */
  image: "/og-image.png",
  logo: "/brand/logo-blue.svg",
  themeColor: "#0042e7",
  repository: "https://github.com/Amplified-Access/watchtower",
  license: "https://opensource.org/license/mit",
} as const;

/** Amplified Access builds and runs WatchTower: the publisher in structured data. */
export const PUBLISHER = {
  name: "Amplified Access",
  url: "https://www.amplifiedaccess.org",
  logo: "https://www.amplifiedaccess.org/images/icon.png",
  email: "hello@amplifiedaccess.org",
  sameAs: [
    "https://x.com/AmpAccessOrg",
    "https://www.linkedin.com/company/amplifiedaccess",
    "https://github.com/Amplified-Access",
  ],
} as const;

/** Absolute URL for a site path, e.g. `abs("/maps")`. */
export const abs = (path: string) => new URL(path, SITE.url).toString();

const bareHost = (host: string) => host.replace(/^www\./, "");

/**
 * Whether search engines may index this deployment. Only production on this
 * site's domain: staging, Vercel previews and other Vercel projects deployed
 * from this repo (watchtower-test) serve the same pages and must not compete
 * with it. Outside Vercel there is no VERCEL_ENV, which counts as
 * production: it only matters if the site is ever hosted elsewhere, and then
 * it should be indexed.
 */
export const isIndexable = () => {
  const { VERCEL_ENV, VERCEL_PROJECT_PRODUCTION_URL } = process.env;
  if (!VERCEL_ENV) return true;
  if (VERCEL_ENV !== "production") return false;
  return !VERCEL_PROJECT_PRODUCTION_URL || bareHost(VERCEL_PROJECT_PRODUCTION_URL) === bareHost(new URL(SITE.url).host);
};

// Open Graph wants language_TERRITORY. Each language is paired with the
// country WatchTower serves it in.
const OG_LOCALES: Record<string, string> = {
  en: "en_US",
  fr: "fr_FR",
  sw: "sw_KE",
  lg: "lg_UG",
  rw: "rw_RW",
  am: "am_ET",
  pa: "pa_PK",
  ur: "ur_PK",
  ki: "ki_KE",
  suk: "suk_TZ",
  luo: "luo_KE",
  om: "om_ET",
  din: "din_SS",
};

export const ogLocale = (locale: string) => OG_LOCALES[locale] ?? OG_LOCALES.en;
