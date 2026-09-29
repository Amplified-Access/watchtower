// Builds seed/seed.ndjson, the initial dataset import, from the English source
// in seed/source.ts and the translations in seed/translations/<lang>.json.
//
//   pnpm sanity:seed:build            regenerate seed.ndjson
//   pnpm sanity:seed:build --strings  write seed/translations/en.json, the flat
//                                     table of every translatable string (the
//                                     input for translating the seed into
//                                     another language)
//
// Category names are in seed/categories.json: they were the listing page's
// filter chips in the frontend's messages/*.json, translated into every
// language, before Sanity existed.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { BASE_LANGUAGE, LANGUAGES } from "../../src/sanity/languages";
import {
  PLACEHOLDER_CASE_STUDIES,
  PRIVACY_POLICY_LAST_UPDATED,
  PRIVACY_POLICY_SECTIONS,
  type CaseStudyBlock,
  type PolicyBlock,
} from "./source";

const here = dirname(fileURLToPath(import.meta.url));
const translationsDir = join(here, "translations");

// Legal text needs a reviewed translation, so the privacy policy is seeded in
// English only (every language falls back to it) until one exists.
const LEGAL_KEY_PREFIX = "privacy.";

// ── Translatable strings ────────────────────────────────────────────────────

const strings: Record<string, string> = {};
const str = (key: string, value: string) => {
  strings[key] = value;
  return key;
};

const translations: Record<string, Record<string, string>> = {};
for (const { id } of LANGUAGES) {
  const file = join(translationsDir, `${id}.json`);
  if (id !== BASE_LANGUAGE && existsSync(file)) translations[id] = JSON.parse(readFileSync(file, "utf8"));
}

const translate = (key: string, language: string) =>
  language === BASE_LANGUAGE ? strings[key] : translations[language]?.[key];

// An internationalized array holding `build(language)` for every language that
// has all of the strings it needs. A language missing any of them is left out
// entirely rather than half-translated, so the site shows English instead.
const localized = <T>(valueType: string, build: (t: (key: string) => string) => T) =>
  LANGUAGES.flatMap(({ id }) => {
    let missing = false;
    const value = build((key) => {
      const text = translate(key, id);
      if (text === undefined || (id !== BASE_LANGUAGE && key.startsWith(LEGAL_KEY_PREFIX))) missing = true;
      return text ?? "";
    });
    return missing ? [] : [{ _key: id, _type: `internationalizedArray${valueType}Value`, language: id, value }];
  });

const localizedString = (key: string) => localized("String", (t) => t(key));
const localizedText = (key: string) => localized("Text", (t) => t(key));

// ── Portable Text ───────────────────────────────────────────────────────────

let keyCounter = 0;
const nextKey = () => `k${(keyCounter++).toString(36).padStart(4, "0")}`;

const block = (text: string, { style = "normal", strong = false, listItem }: { style?: string; strong?: boolean; listItem?: string } = {}) => ({
  _key: nextKey(),
  _type: "block",
  style,
  ...(listItem ? { listItem, level: 1 } : {}),
  markDefs: [],
  children: [{ _key: nextKey(), _type: "span", marks: strong ? ["strong"] : [], text }],
});

const imageAsset = (publicPath: string) => ({
  _type: "image",
  _sanityAsset: `image@file://./images/${basename(publicPath)}`,
});

// ── Categories ──────────────────────────────────────────────────────────────

const CATEGORY_SLUGS = ["climate", "water-sanitation", "rights-safety", "public-services"];

const categoryNames: Record<string, Record<string, string>> = JSON.parse(
  readFileSync(join(here, "categories.json"), "utf8"),
);

const categoryDocs = CATEGORY_SLUGS.map((slug, index) => ({
  _id: `caseStudyCategory-${slug}`,
  _type: "caseStudyCategory",
  slug: { _type: "slug", current: slug },
  order: index + 1,
  title: LANGUAGES.flatMap(({ id }) => {
    const value = categoryNames[id]?.[slug];
    return value ? [{ _key: id, _type: "internationalizedArrayStringValue", language: id, value }] : [];
  }),
}));

// ── Case studies ────────────────────────────────────────────────────────────

const caseStudyBody = (prefix: string, blocks: CaseStudyBlock[]) => {
  // Register the strings once, then build each language from the same keys.
  const keyed = blocks.map((b, i) => {
    const key = `${prefix}.${i}`;
    switch (b.type) {
      case "image":
        return { b, alt: str(`${key}.alt`, b.alt) };
      case "stats":
        return {
          b,
          items: b.items.map((item, j) => ({
            label: str(`${key}.${j}.label`, item.label),
            unit: item.unit ? str(`${key}.${j}.unit`, item.unit) : undefined,
          })),
        };
      case "mapLink":
        return { b };
      default:
        return { b, text: str(key, b.text) };
    }
  });

  const STYLES = { heading: "h2", subheading: "h3", quote: "blockquote", paragraph: "normal" } as const;

  return localized("CaseStudyBody", (t) => {
    keyCounter = 0;
    return keyed.map((k): object => {
      const { b } = k;
      switch (b.type) {
        case "image":
          return { _key: nextKey(), ...imageAsset(b.src), _type: "bodyImage", alt: t(k.alt!) };
        case "stats":
          return {
            _key: nextKey(),
            _type: "stats",
            items: b.items.map((item, j) => ({
              _key: nextKey(),
              _type: "stat",
              value: item.value,
              ...(k.items![j].unit ? { unit: t(k.items![j].unit!) } : {}),
              label: t(k.items![j].label),
            })),
          };
        case "mapLink":
          return { _key: nextKey(), _type: "mapLink", href: b.href };
        default:
          return block(t(k.text!), { style: STYLES[b.type] });
      }
    });
  });
};

const caseStudyDocs = PLACEHOLDER_CASE_STUDIES.map((cs) => {
  const p = `caseStudy.${cs.slug}`;
  const title = str(`${p}.title`, cs.title);
  const summary = str(`${p}.summary`, cs.summary);
  const location = str(`${p}.location`, cs.location);
  const deployment = cs.deployment ? str(`${p}.deployment`, cs.deployment) : undefined;
  const imageAlt = str(`${p}.imageAlt`, cs.imageAlt);

  return {
    _id: `caseStudy-${cs.slug}`,
    _type: "caseStudy",
    slug: { _type: "slug", current: cs.slug },
    title: localizedString(title),
    summary: localizedText(summary),
    category: { _type: "reference", _ref: `caseStudyCategory-${cs.category}` },
    location: localizedString(location),
    ...(deployment ? { deployment: localizedString(deployment) } : {}),
    publishedAt: cs.publishedAt,
    featured: cs.featured ?? false,
    image: { ...imageAsset(cs.imageUrl), alt: localizedString(imageAlt) },
    ...(cs.body ? { body: caseStudyBody(`${p}.body`, cs.body) } : {}),
  };
});

// ── Privacy policy ──────────────────────────────────────────────────────────

const policyBody = (prefix: string, blocks: PolicyBlock[]) => {
  const keyed = blocks.map((b, i) => {
    const key = `${prefix}.${i}`;
    switch (b.type) {
      case "paragraph":
      case "emphasis":
        return { b, text: str(key, b.text) };
      case "list":
        return {
          b,
          title: b.title ? str(`${key}.title`, b.title) : undefined,
          items: b.items.map((item, j) => str(`${key}.${j}`, item)),
        };
      case "definitions":
        return {
          b,
          terms: b.items.map((item, j) => ({
            term: str(`${key}.${j}.term`, item.term),
            description: str(`${key}.${j}.description`, item.description),
          })),
        };
      case "link":
        return { b, text: str(key, b.text) };
      case "contact":
        return { b, labels: b.items.map((item, j) => str(`${key}.${j}.label`, item.label)) };
    }
  });

  return localized("PolicyBody", (t) => {
    keyCounter = 0;
    return keyed.flatMap((k): object[] => {
      const { b } = k;
      switch (b.type) {
        case "paragraph":
          return [block(t(k.text!))];
        case "emphasis":
          return [block(t(k.text!), { strong: true })];
        case "list":
          return [
            ...(k.title ? [block(t(k.title), { strong: true })] : []),
            ...k.items!.map((item) => block(t(item), { listItem: "bullet" })),
          ];
        case "definitions":
          return [
            {
              _key: nextKey(),
              _type: "definitions",
              items: k.terms!.map(({ term, description }) => ({
                _key: nextKey(),
                _type: "definition",
                term: t(term),
                description: t(description),
              })),
            },
          ];
        case "link":
          return [{ _key: nextKey(), _type: "callToAction", text: t(k.text!), href: b.href }];
        case "contact":
          return [
            {
              _key: nextKey(),
              _type: "contacts",
              items: b.items.map((item, j) => ({
                _key: nextKey(),
                _type: "contact",
                label: t(k.labels![j]),
                email: item.email,
              })),
            },
          ];
      }
    });
  });
};

const privacyPolicyDoc = {
  _id: "privacyPolicy",
  _type: "legalPage",
  name: "Privacy policy",
  lastUpdated: PRIVACY_POLICY_LAST_UPDATED,
  sections: PRIVACY_POLICY_SECTIONS.map((section) => ({
    _key: section.id,
    _type: "policySection",
    anchor: { _type: "slug", current: section.id },
    title: localizedString(str(`privacy.${section.id}.title`, section.title)),
    body: policyBody(`privacy.${section.id}.body`, section.blocks),
  })),
};

// ── Output ──────────────────────────────────────────────────────────────────

if (process.argv.includes("--strings")) {
  // Legal strings are left out: they need a reviewed translation.
  const translatable = Object.fromEntries(
    Object.entries(strings).filter(([key]) => !key.startsWith(LEGAL_KEY_PREFIX)),
  );
  writeFileSync(join(translationsDir, "en.json"), `${JSON.stringify(translatable, null, 2)}\n`);
  console.log(`Wrote ${Object.keys(translatable).length} strings to seed/translations/en.json`);
} else {
  const docs = [...categoryDocs, ...caseStudyDocs, privacyPolicyDoc];
  const lines = docs.map((doc) => JSON.stringify(doc));

  // `sanity datasets import` refuses U+FFFD (the "�" left where a character
  // was mangled), which machine translation occasionally produces. Fail here,
  // naming the string, rather than halfway through someone's setup.
  const mangled = Object.entries(translations).flatMap(([language, table]) =>
    Object.entries(table)
      .filter(([, text]) => text.includes("�"))
      .map(([key]) => `  seed/translations/${language}.json: ${key}`),
  );
  if (mangled.length > 0 || lines.some((line) => line.includes("�"))) {
    console.error(`Found the replacement character "�" (a mangled character) in:\n${mangled.join("\n")}`);
    process.exit(1);
  }

  writeFileSync(join(here, "seed.ndjson"), `${lines.join("\n")}\n`);
  const languages = Object.keys(translations).length + 1;
  console.log(`Wrote ${docs.length} documents to seed/seed.ndjson (${languages} languages)`);
}
