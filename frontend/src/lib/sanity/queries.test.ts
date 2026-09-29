/**
 * @jest-environment node
 */
// Runs the real GROQ queries against the seed dataset (sanity/seed/seed.ndjson)
// with groq-js, Sanity's own query engine, so the locale fallback is tested
// without a Sanity project.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { evaluate, parse } from "groq-js";
import {
  CASE_STUDIES_QUERY,
  CASE_STUDY_CATEGORIES_QUERY,
  CASE_STUDY_QUERY,
  LEGAL_PAGE_QUERY,
} from "./queries";
import type { CaseStudy, CaseStudyCategory, CaseStudySummary, LegalPage } from "./types";

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
