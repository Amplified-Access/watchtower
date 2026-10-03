/**
 * @jest-environment node
 */
// Runs the real GROQ queries against the seed dataset (sanity/seed/seed.ndjson)
// with groq-js, Sanity's own query engine, so the locale fallback is tested
// without a Sanity project.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { evaluate, parse } from "groq-js";
import { locales } from "@/i18n/locales";
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
  CaseStudy,
  CaseStudyCategory,
  CaseStudySummary,
  HomePageContent,
  LegalPage,
  SharedHomeSections,
  AboutPageContent,
  LlmsContent,
  SeoSettings,
  SitemapContent,
} from "./types";
import { DEFAULT_PAGE_SEO, SEO_PAGE_KEYS } from "@/lib/seo/defaults";
import { buildLlmsFull, buildLlmsTxt } from "@/lib/seo/llms";

type Doc = Record<string, unknown>;

// `sanity dataset import` uploads `_sanityAsset: "image@file://./images/x.webp"`
// and swaps in a reference; do the same with a stand-in asset document.
const loadSeed = () => {
  const assets = new Map<string, Doc>();
  const resolveAssets = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(resolveAssets);
    if (!value || typeof value !== "object") return value;
    const { _sanityAsset, ...rest } = value as Doc;
    const out: Doc = Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, resolveAssets(v)]));
    if (typeof _sanityAsset === "string") {
      const file = _sanityAsset.split("/").pop()!;
      const id = `image-${file.replace(/\W/g, "-")}`;
      assets.set(id, { _id: id, _type: "sanity.imageAsset", url: `https://cdn.sanity.io/${file}`, metadata: { lqip: "data:lqip" } });
      out.asset = { _type: "reference", _ref: id };
    }
    return out;
  };
  const docs = readFileSync(join(__dirname, "../../../sanity/seed/seed.ndjson"), "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => resolveAssets(JSON.parse(line)) as Doc);
  return [...docs, ...assets.values()];
};

const run = async <T>(query: string, dataset: Doc[], params: Record<string, unknown>) =>
  (await (await evaluate(parse(query), { dataset, params })).get()) as T;

const seed = loadSeed();

const item = (language: string, value: unknown, type = "String") => ({
  _key: language,
  _type: `internationalizedArray${type}Value`,
  language,
  value,
});

const block = (text: string) => ({
  _key: text,
  _type: "block",
  style: "normal",
  markDefs: [],
  children: [{ _key: "s", _type: "span", marks: [], text }],
});

describe("case study queries against the seed", () => {
  it("lists every case study newest first with its category", async () => {
    const studies = await run<CaseStudySummary[]>(CASE_STUDIES_QUERY, seed, { locale: "en" });
    expect(studies).toHaveLength(9);
    const dates = studies.map((s) => s.publishedAt);
    expect(dates).toEqual([...dates].sort().reverse());
    expect(studies[0]).toMatchObject({
      slug: "water-access-kampala",
      title: "When access to water becomes uncertain",
      category: { slug: "water-sanitation", title: "Water & Sanitation" },
      featured: true,
      image: { url: expect.stringContaining("placeholder-market"), alt: expect.any(String) },
    });
  });

  it("returns category chips in editor order, translated", async () => {
    const en = await run<CaseStudyCategory[]>(CASE_STUDY_CATEGORIES_QUERY, seed, { locale: "en" });
    const fr = await run<CaseStudyCategory[]>(CASE_STUDY_CATEGORIES_QUERY, seed, { locale: "fr" });
    expect(en.map((c) => c.slug)).toEqual(["climate", "water-sanitation", "rights-safety", "public-services"]);
    expect(fr[0].title).not.toBe(en[0].title);
  });

  it("serves a translated study in the reader's language", async () => {
    const en = await run<CaseStudy>(CASE_STUDY_QUERY, seed, { slug: "water-access-kampala", locale: "en" });
    const fr = await run<CaseStudy>(CASE_STUDY_QUERY, seed, { slug: "water-access-kampala", locale: "fr" });
    expect(fr.title).not.toBe(en.title);
    expect(fr.bodyLanguage).toBe("fr");
    expect(fr.category?.title).not.toBe(en.category?.title);
  });

  it("falls back to English for a language nothing is translated into", async () => {
    const [study] = await run<CaseStudySummary[]>(CASE_STUDIES_QUERY, seed, { locale: "xx" });
    expect(study.title).toBe("When access to water becomes uncertain");
  });

  it("returns one study with its body, meta and two related studies from the same category first", async () => {
    const study = await run<CaseStudy>(CASE_STUDY_QUERY, seed, { slug: "water-access-kampala", locale: "en" });
    expect(study.deployment).toBe("Community Water Watch");
    expect(study.bodyLanguage).toBe("en");
    expect(study.body?.map((b) => b._type)).toEqual(
      expect.arrayContaining(["block", "bodyImage", "stats", "mapLink"]),
    );
    const image = study.body?.find((b) => b._type === "bodyImage");
    expect(image).toMatchObject({ url: expect.stringContaining("cdn.sanity.io"), alt: expect.any(String) });
    expect(study.related).toHaveLength(2);
    expect(study.related[0].category?.slug).toBe("water-sanitation");
  });

  it("returns null for an unknown slug", async () => {
    expect(await run(CASE_STUDY_QUERY, seed, { slug: "nope", locale: "en" })).toBeNull();
  });
});

describe("field-by-field fallback", () => {
  const dataset: Doc[] = [
    {
      _id: "caseStudy-partial",
      _type: "caseStudy",
      slug: { current: "partial" },
      publishedAt: "2026-01-01",
      title: [item("en", "English title"), item("fr", "Titre français")],
      summary: [item("en", "English summary", "Text"), item("fr", "", "Text")],
      location: [item("en", "Kenya")],
      body: [item("en", [block("English body")], "CaseStudyBody"), item("fr", [], "CaseStudyBody")],
    },
  ];

  it("uses each translated field and English for the rest, treating empty values as missing", async () => {
    const study = await run<CaseStudy>(CASE_STUDY_QUERY, dataset, { slug: "partial", locale: "fr" });
    expect(study.title).toBe("Titre français");
    expect(study.summary).toBe("English summary");
    expect(study.location).toBe("Kenya");
    expect(study.body).toHaveLength(1);
    expect(study.bodyLanguage).toBe("en");
    expect(study.deployment).toBeNull();
  });
});

describe("legal page query against the seed", () => {
  it("returns the privacy policy sections with stable anchors", async () => {
    const page = await run<LegalPage>(LEGAL_PAGE_QUERY, seed, { id: "privacyPolicy", locale: "en" });
    expect(page.lastUpdated).toBe("2026-09-01");
    expect(page.sections[0]).toMatchObject({ id: "overview", title: "Overview", language: "en" });
    expect(page.sections.map((s) => s.id)).toContain("contact-us");
    const contacts = page.sections.at(-1)!.body.find((b) => b._type === "contacts");
    expect(contacts).toBeDefined();
  });

  it("serves the English policy, marked as English, to other languages until a reviewed translation exists", async () => {
    const page = await run<LegalPage>(LEGAL_PAGE_QUERY, seed, { id: "privacyPolicy", locale: "sw" });
    expect(page.sections[0]).toMatchObject({
      id: "overview",
      title: "Overview",
      titleLanguage: "en",
      language: "en",
    });
  });
});

// Every string anywhere in a query result, with its path, for completeness checks.
const strings = (value: unknown, path = ""): [string, string][] =>
  typeof value === "string"
    ? [[path, value]]
    : Array.isArray(value)
      ? value.flatMap((item, i) => strings(item, `${path}[${i}]`))
      : value && typeof value === "object"
        ? Object.entries(value).flatMap(([key, item]) => (key === "_key" ? [] : strings(item, `${path}.${key}`)))
        : [];

type AboutResult = { about: Omit<AboutPageContent, "home">; home: SharedHomeSections };

// The text blocks of a policy body, for inspecting their marks and links.
type TextBlock = { style?: string; markDefs: { href: string }[]; children: { marks: string[]; text: string }[] };
const textBlocks = (body: LegalPage["sections"][number]["body"]) => body as unknown as TextBlock[];

describe("page queries against the seed", () => {
  it("fills every text on the home and about pages in every language", async () => {
    for (const locale of locales) {
      const home = await run<HomePageContent>(HOME_PAGE_QUERY, seed, { locale });
      const about = await run<AboutResult>(ABOUT_PAGE_QUERY, seed, { locale });
      const empty = [...strings(home, "home"), ...strings(about, "about")].filter(([, text]) => !text.trim());
      expect({ locale, empty }).toEqual({ locale, empty: [] });
    }
  });

  it("returns the home page's repeated sections as lists, and its headings' line breaks", async () => {
    const home = await run<HomePageContent>(HOME_PAGE_QUERY, seed, { locale: "en" });
    expect(home.stats.map((stat) => stat.value)).toEqual(["2,000+", "22", "13", "6"]);
    expect(home.howItWorks.steps).toHaveLength(3);
    expect(home.faqs.items).toHaveLength(5);
    expect(home.insights.sampleTitles).toHaveLength(3);
    expect(home.speakNaturally.title).toBe("Report naturally\nin your language.");
  });

  it("translates the home page", async () => {
    const en = await run<HomePageContent>(HOME_PAGE_QUERY, seed, { locale: "en" });
    const fr = await run<HomePageContent>(HOME_PAGE_QUERY, seed, { locale: "fr" });
    expect(fr.hero.description).not.toBe(en.hero.description);
    expect(fr.stats[0].label).not.toBe(en.stats[0].label);
    expect(fr.stats[0].value).toBe(en.stats[0].value);
  });

  it("gives the about page the sections it shares with the home page", async () => {
    const home = await run<HomePageContent>(HOME_PAGE_QUERY, seed, { locale: "sw" });
    const { about, home: shared } = await run<AboutResult>(ABOUT_PAGE_QUERY, seed, { locale: "sw" });
    expect(shared.howItWorks).toEqual(home.howItWorks);
    expect(shared.stats).toEqual(home.stats);
    expect(about.safety.items).toHaveLength(5);
  });

  it("returns the about page's steps and audiences, translated, with their headings' line breaks", async () => {
    const { about: en } = await run<AboutResult>(ABOUT_PAGE_QUERY, seed, { locale: "en" });
    const { about: fr } = await run<AboutResult>(ABOUT_PAGE_QUERY, seed, { locale: "fr" });
    expect(en.steps.map((step) => step.label)).toEqual(["Report", "Understand trends", "Drive action"]);
    expect(en.audiences.items).toHaveLength(3);
    expect(en.approach.heading).toBe("From individual voices\nto a bigger picture.");
    expect(fr.steps[0].title).not.toBe(en.steps[0].title);
    expect(fr.audiences.items[2].description).not.toBe(en.audiences.items[2].description);
  });
});

describe("policy page queries against the seed", () => {
  it("returns the security policy's header, search title and an untitled introduction", async () => {
    const page = await run<LegalPage>(LEGAL_PAGE_QUERY, seed, { id: "security", locale: "fr" });
    expect(page.hero.title).toBeTruthy();
    expect(page.seo.title).toBeTruthy();
    expect(page.sections[0]).toMatchObject({ id: "introduction", title: null, language: "fr" });
    const disclosure = page.sections.find((s) => s.id === "disclosure-policy")!;
    const [paragraph] = textBlocks(disclosure.body);
    expect(paragraph.markDefs[0].href).toContain("Coordinated_vulnerability_disclosure");
  });

  it("keeps the code of conduct's subheadings, bold labels and links", async () => {
    const page = await run<LegalPage>(LEGAL_PAGE_QUERY, seed, { id: "codeOfConduct", locale: "en" });
    const guidelines = textBlocks(page.sections.find((s) => s.id === "enforcement-guidelines")!.body);
    expect(guidelines.filter((b) => b.style === "h3")).toHaveLength(4);
    expect(guidelines[2].children[0]).toMatchObject({ marks: ["strong"], text: "Community Impact:" });
    const attribution = textBlocks(page.sections.at(-1)!.body);
    expect(attribution[0].markDefs.map((d) => d.href)).toEqual([
      "https://www.contributor-covenant.org",
      "https://www.contributor-covenant.org/version/2/1/code_of_conduct/",
    ]);
  });

  it("gives the privacy policy a translated header", async () => {
    const en = await run<LegalPage>(LEGAL_PAGE_QUERY, seed, { id: "privacyPolicy", locale: "en" });
    const fr = await run<LegalPage>(LEGAL_PAGE_QUERY, seed, { id: "privacyPolicy", locale: "fr" });
    expect(en.hero.title).toBe("Privacy Policy");
    expect(fr.hero.title).not.toBe(en.hero.title);
  });
});

describe("search and sharing queries against the seed", () => {
  it("gives every code-built page a title and description in English, from the defaults", async () => {
    const settings = await run<SeoSettings>(SEO_SETTINGS_QUERY, seed, { locale: "en" });
    expect(settings.description).toBeTruthy();
    expect(settings.image).toBeNull();
    for (const key of SEO_PAGE_KEYS) {
      expect(settings.pages[key]).toMatchObject(DEFAULT_PAGE_SEO[key]);
    }
  });

  it("translates the pages the site already had text for, and falls back to English for the rest", async () => {
    const fr = await run<SeoSettings>(SEO_SETTINGS_QUERY, seed, { locale: "fr" });
    expect(fr.pages.maps.title).not.toBe(DEFAULT_PAGE_SEO.maps.title);
    expect(fr.pages.report.description).not.toBe(DEFAULT_PAGE_SEO.report.description);
    expect(fr.pages.thematicMap).toMatchObject(DEFAULT_PAGE_SEO.thematicMap);
  });

  it("gives the home, about and policy pages search text in every language", async () => {
    for (const locale of locales) {
      const home = await run<HomePageContent>(HOME_PAGE_QUERY, seed, { locale });
      const security = await run<LegalPage>(LEGAL_PAGE_QUERY, seed, { id: "security", locale });
      expect({ locale, home: !!home.seo.title && !!home.seo.description }).toEqual({ locale, home: true });
      // The brand is added by the site: titles in Sanity leave it out.
      expect(security.seo.title).not.toMatch(/WatchTower/);
    }
    const fr = await run<HomePageContent>(HOME_PAGE_QUERY, seed, { locale: "fr" });
    const en = await run<HomePageContent>(HOME_PAGE_QUERY, seed, { locale: "en" });
    expect(fr.seo.title).not.toBe(en.seo.title);
    expect(fr.seo.title).not.toMatch(/[.!]$/);
  });

  it("describes the privacy policy, whose title stays the translated header", async () => {
    const sw = await run<LegalPage>(LEGAL_PAGE_QUERY, seed, { id: "privacyPolicy", locale: "sw" });
    expect(sw.seo.title).toBe("");
    expect(sw.seo.description).toBeTruthy();
  });

  it("lists every case study and page for the sitemap", async () => {
    const sitemap = await run<SitemapContent>(SITEMAP_QUERY, seed, {});
    expect(sitemap.caseStudies).toHaveLength(9);
    expect(sitemap.pages.map((page) => page._id).sort()).toEqual(
      ["aboutPage", "codeOfConduct", "homePage", "privacyPolicy", "security"].sort(),
    );
  });

  it("builds llms.txt and llms-full.txt from the seed", async () => {
    const content = await run<LlmsContent>(LLMS_QUERY, seed, { locale: "en" });
    const input = {
      content,
      description: "WatchTower description.",
      pages: DEFAULT_PAGE_SEO,
      aboutDescription: "About description.",
    };
    const index = buildLlmsTxt(input);
    const full = buildLlmsFull(input);
    expect(index).toMatch(/^# WatchTower\n\n> WatchTower description\./);
    expect(index).toContain("https://www.thewatchtower.tech/case-studies/water-access-kampala");
    expect(index).toContain("https://www.thewatchtower.tech/privacy-policy");
    expect(full).toContain("## Frequently asked questions");
    expect(full).toContain("### When access to water becomes uncertain");
    expect(full).toContain("#### Overview");
    for (const text of [index, full]) {
      expect(text).not.toMatch(/undefined|\[object Object\]|\n{3,}/);
    }
  });
});
