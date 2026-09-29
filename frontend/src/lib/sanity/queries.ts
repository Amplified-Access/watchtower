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

// A legal page (e.g. `privacyPolicy`), sectioned for the table of contents.
export const LEGAL_PAGE_QUERY = `*[_type == "legalPage" && _id == $id][0] {
  lastUpdated,
  "sections": sections[defined(anchor.current)] {
    "id": anchor.current,
    "title": ${localized("title")},
    "titleLanguage": ${servedLanguage("title")},
    "body": ${localized("body")},
    "language": ${servedLanguage("body")}
  }
}`;
