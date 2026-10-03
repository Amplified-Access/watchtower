// Seed "Search and sharing" text: the `seoSettings` document and the search
// fields of the Home, About and privacy policy documents.
//
// English is written for search results (src/lib/seo/defaults.ts, which the
// site also falls back to). The other languages reuse text the site already
// has in that language, the page's heading and introduction from
// seed/pages/<lang>.json or messages/<lang>.json, so a French reader's tab
// and link previews are in French from the start. Editors refine them in
// the Studio. Pages with no such text (the thematic maps, the chat's
// description) fall back to English until someone translates them.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DEFAULT_ABOUT_SEO,
  DEFAULT_HOME_SEO,
  DEFAULT_PAGE_SEO,
  DEFAULT_PRIVACY_SEO,
  SEO_PAGE_KEYS,
  type SeoPageKey,
} from "../../src/lib/seo/defaults";
import { SITE } from "../../src/lib/seo/site";
import { BASE_LANGUAGE, LANGUAGES } from "../../src/sanity/languages";

type Strings = Record<string, string>;
type Messages = Record<string, Record<string, unknown>>;


// "Report in your language." reads as a heading; a title needs no full stop.
const asTitle = (text: string) => text.replace(/[.!。]+$/u, "").trim();

/** A key in messages/<lang>.json ("MapsPage.liveMapTitle") or seed/pages/<lang>.json ("Home.heroDescription"). */
type Source = { messages: string } | { pages: string };

type FieldSource = { title?: Source; description?: Source };

// Where each page's text comes from in the languages other than English.
const PAGE_SOURCES: Record<SeoPageKey, FieldSource> = {
  caseStudies: { title: { messages: "CaseStudiesPage.eyebrow" }, description: { messages: "CaseStudiesPage.heroDescription" } },
  maps: { title: { messages: "Maps.title" }, description: { messages: "MapsPage.heroDescription" } },
  liveMap: { title: { messages: "MapsPage.liveMapTitle" }, description: { messages: "MapsPage.liveMapDescription" } },
  thematicMap: {},
  report: { title: { messages: "AnonymousReporting.pageTitle" }, description: { messages: "AnonymousReporting.pageIntro" } },
  alerts: { title: { messages: "Alerts.pageTitle" }, description: { messages: "Alerts.pageDescription" } },
  chat: { title: { messages: "Footer.askWatchtower" } },
  registerOrganization: { title: { messages: "Footer.createADeployment" } },
  signIn: { title: { messages: "Auth.signIn" } },
};

/** `pages`: seed/pages/<lang>.json by language. `messagesDir`: the frontend's messages/. */
export const buildSeoDocs = (pages: Record<string, Strings>, messagesDir: string) => {
  const messages: Record<string, Messages> = Object.fromEntries(
    LANGUAGES.map(({ id }) => [id, JSON.parse(readFileSync(join(messagesDir, `${id}.json`), "utf8"))]),
  );

  const lookup = (language: string, source: Source | undefined): string | undefined => {
    if (!source) return undefined;
    if ("pages" in source) return pages[language]?.[source.pages];
    const [namespace, key] = source.messages.split(".");
    const value = messages[language]?.[namespace]?.[key];
    return typeof value === "string" ? value : undefined;
  };

  // One internationalized-array value per language that has text: English
  // from `english`, the others from `source`.
  const localized = (type: "String" | "Text", english: string, source?: Source, format = (text: string) => text) =>
    LANGUAGES.flatMap(({ id }) => {
      const value = id === BASE_LANGUAGE ? english : lookup(id, source);
      return value ? [{ _key: id, _type: `internationalizedArray${type}Value`, language: id, value: format(value) }] : [];
    });

  const seo = (english: { title: string; description: string }, sources: FieldSource) => ({
    _type: "seo",
    title: localized("String", english.title, sources.title, asTitle),
    description: localized("Text", english.description, sources.description),
  });

  const settings = {
    _id: "seoSettings",
    _type: "seoSettings",
    description: localized("Text", SITE.description),
    ...Object.fromEntries(SEO_PAGE_KEYS.map((key) => [key, seo(DEFAULT_PAGE_SEO[key], PAGE_SOURCES[key])])),
  };

  return {
    settings,
    home: seo(DEFAULT_HOME_SEO, { title: { pages: "Home.heroTitleLine1" }, description: { pages: "Home.heroDescription" } }),
    about: seo(DEFAULT_ABOUT_SEO, { title: { messages: "Navigation.about" }, description: { pages: "About.heroDescription" } }),
    // The policy is English only until a reviewed translation exists, and its
    // title is the translated page header: only the description is seeded.
    privacyPolicy: { _type: "seo", description: localized("Text", DEFAULT_PRIVACY_SEO.description) },
  };
};
