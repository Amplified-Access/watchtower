// GROQ queries for the content managed in Sanity (edited at /studio; schema in
// src/sanity/schemaTypes).
//
// Translatable fields are internationalized arrays — one `{language, value}`
// item per language — and every query takes a `$locale` parameter. `localized`
// picks the reader's language and falls back to English field by field, so a
// half-translated document shows what it has and English for the rest.
//
// Kept free of server-only imports so the tests can run these queries against
// the seed data with groq-js.
import { defaultLocale } from "@/i18n/locales";

// An empty string or an empty body counts as untranslated. `count` is null
// for strings, hence the coalesce.
const hasValue = `defined(value) && value != "" && coalesce(count(value), 1) > 0`;

export const localized = (field: string) =>
  `coalesce(${field}[language == $locale && ${hasValue}][0].value, ${field}[language == "${defaultLocale}"][0].value)`;

// The language a localized field was actually served in, so the page can mark
// English fallback text with `lang="en"` for screen readers and translation tools.
const servedLanguage = (field: string) =>
  `coalesce(${field}[language == $locale && ${hasValue}][0].language, "${defaultLocale}")`;

// What `SanityImage` needs to crop and position an image as the editor set it.
const imageFields = `"url": asset->url, "lqip": asset->metadata.lqip, "dimensions": asset->metadata.dimensions{width, height}, crop, hotspot`;

const image = (field: string) => `${field}{
  ${imageFields},
  "alt": ${localized("alt")}
}`;

const caseStudyCard = `
  "slug": slug.current,
  "title": ${localized("title")},
  "summary": ${localized("summary")},
  "category": category->{ "slug": slug.current, "title": ${localized("title")} },
  "location": ${localized("location")},
  publishedAt,
  "featured": featured == true,
  "image": ${image("image")}
`;

// Every case study, newest first. The listing page splits them into the
// featured block and the filtered list.
export const CASE_STUDIES_QUERY = `*[_type == "caseStudy" && defined(slug.current)] | order(publishedAt desc) {${caseStudyCard}}`;

// Filter chips, in the order editors set.
export const CASE_STUDY_CATEGORIES_QUERY = `*[_type == "caseStudyCategory" && defined(slug.current)] | order(order asc) {
  "slug": slug.current,
  "title": ${localized("title")}
}`;

// One case study, with the body in the reader's language (or English) and two
// related studies: the same category first, then the most recent others.
// `sameCategory` is worked out in a projection, where ^ is the study being
// read, and then sorted on, which keeps ^ out of order().
export const CASE_STUDY_QUERY = `*[_type == "caseStudy" && slug.current == $slug][0] {
  ${caseStudyCard},
  "deployment": ${localized("deployment")},
  "body": ${localized("body")}[]{
    ...,
    _type == "bodyImage" => { ${imageFields} }
  },
  "bodyLanguage": ${servedLanguage("body")},
  "related": *[_type == "caseStudy" && defined(slug.current) && slug.current != $slug]{
      ...,
      "sameCategory": category._ref == ^.category._ref
    }
    | order(sameCategory desc, publishedAt desc) [0...2] {${caseStudyCard}}
}`;

// ── Pages ────────────────────────────────────────────────────────────────────
// Page text is always a string, empty when a field has no value in any
// language, so the page components need no null checks.
const text = (field: string) => `coalesce(${localized(field)}, "")`;
const texts = (fields: Record<string, string>) =>
  Object.entries(fields)
    .map(([name, field]) => `"${name}": ${text(field)}`)
    .join(", ");

const pageHero = `"hero": { ${texts({ eyebrow: "hero.eyebrow", title: "hero.title", description: "hero.description" })} }`;
const faqItems = (field: string) =>
  `coalesce(${field}[]{ _key, ${texts({ question: "question", answer: "answer" })} }, [])`;

// The parts of the home page the about page shows too: edited once, on Home.
const sharedHomeSections = `
  "stats": coalesce(stats[]{ _key, "value": coalesce(value, ""), "label": ${text("label")} }, []),
  "howItWorks": {
    ${texts({ heading: "howItWorks.heading", description: "howItWorks.description" })},
    "steps": coalesce(howItWorks.steps[]{ _key, ${texts({ title: "title", description: "description" })} }, [])
  },
  "faqsLabel": ${text("faqs.label")},
  "impact": { ${texts({ title: "impact.title", description: "impact.description" })} },
  "banner": { ${texts({ text: "banner.text", cta: "banner.cta" })} }`;

export const HOME_PAGE_QUERY = `*[_id == "homePage"][0] {
  "hero": { ${texts({
    titleLine1: "hero.titleLine1",
    titleLine2: "hero.titleLine2",
    description: "hero.description",
    primaryCta: "hero.primaryCta",
    secondaryCta: "hero.secondaryCta",
  })} },
  "explore": { ${texts({ heading: "explore.heading", description: "explore.description" })} },
  "speakNaturally": { ${texts({ title: "speakNaturally.title", description: "speakNaturally.description", cta: "speakNaturally.cta" })} },
  "insights": {
    ${texts({
      label: "insights.label",
      heading: "insights.heading",
      description: "insights.description",
      cta: "insights.cta",
      readStory: "insights.readStory",
    })},
    "sampleTitles": coalesce(insights.sampleTitles[]{ _key, "title": ${text("title")} }, [])
  },
  "faqs": {
    ${texts({ label: "faqs.label", heading: "faqs.heading", description: "faqs.description" })},
    "items": ${faqItems("faqs.items")}
  },
  ${sharedHomeSections}
}`;

export const ABOUT_PAGE_QUERY = `{
  "about": *[_id == "aboutPage"][0] {
    "hero": { ${texts({ title: "hero.title", description: "hero.description", objective: "hero.objective" })} },
    "languages": { ${texts({ heading: "languages.heading", description: "languages.description" })} },
    "safety": {
      ${texts({ title: "safety.title", description: "safety.description" })},
      "items": ${faqItems("safety.items")}
    },
    "cta": { ${texts({
      title: "cta.title",
      description: "cta.description",
      primaryCta: "cta.primaryCta",
      secondaryCta: "cta.secondaryCta",
    })} }
  },
  "home": *[_id == "homePage"][0] { ${sharedHomeSections} }
}`;

// A legal page (`privacyPolicy`, `security`, `codeOfConduct`): its header,
// search title and sections.
export const LEGAL_PAGE_QUERY = `*[_type == "legalPage" && _id == $id][0] {
  ${pageHero},
  "seo": { ${texts({ title: "seo.title", description: "seo.description" })} },
  lastUpdated,
  "sections": sections[defined(anchor.current)] {
    "id": anchor.current,
    "title": ${localized("title")},
    "titleLanguage": ${servedLanguage("title")},
    "body": ${localized("body")},
    "language": ${servedLanguage("body")}
  }
}`;
