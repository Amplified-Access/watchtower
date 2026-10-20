import "server-only";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { defaultLocale } from "@/i18n/locales";
import { getLlmsContent, getSeoSettings } from "@/lib/sanity/content";
import { sanityShareImageSrc } from "@/lib/sanity/image";
import type { LegalPage, SanityImage } from "@/lib/sanity/types";
import { DEFAULT_ABOUT_SEO, DEFAULT_PAGE_SEO, SEO_PAGE_KEYS, type SeoPageKey, type SeoText } from "./defaults";
import type { LlmsInput } from "./llms";
import { fillPlaceholders, ownTitle, pageMetadata } from "./metadata";
import { SITE } from "./site";
import { pageGraph, type PageGraphOptions } from "./structured-data";

// Search text for pages, read from Sanity in the reader's language, with the
// English defaults for whatever is empty in every language.

/** The first of these images that has a file, as a share image URL. Null means the site's generated banner. */
export const firstShareImage = (...images: (SanityImage | null | undefined)[]) =>
  images.map(sanityShareImageSrc).find((src): src is string => !!src) ?? null;

/** The site's share image from "Search and sharing", for pages without their own. */
export const siteShareImage = async (locale: string) => firstShareImage((await getSeoSettings(locale)).image);

/** A code-built page's title, description and share image (SEO_PAGE_KEYS). */
export const getCodePageSeo = async (
  key: SeoPageKey,
  locale: string,
  values: Record<string, string> = {},
): Promise<SeoText & { image: string | null }> => {
  const settings = await getSeoSettings(locale);
  const page = settings.pages[key];
  const fallback = DEFAULT_PAGE_SEO[key];
  return {
    title: fillPlaceholders(ownTitle(page.title) || fallback.title, values),
    description: fillPlaceholders(page.description || fallback.description, values),
    image: firstShareImage(page.image, settings.image),
  };
};

/** generateMetadata for a code-built page. */
export const codePageMetadata = async (
  key: SeoPageKey,
  path: string,
  { values, noindex }: { values?: Record<string, string>; noindex?: boolean } = {},
): Promise<Metadata> => {
  const locale = await getLocale();
  return pageMetadata({ path, locale, noindex, ...(await getCodePageSeo(key, locale, values)) });
};

/** What llms.txt and llms-full.txt are built from: Sanity's content and search text, in English. */
export const getLlmsInput = async (): Promise<LlmsInput> => {
  const [content, settings, pages] = await Promise.all([
    getLlmsContent(),
    getSeoSettings(defaultLocale),
    Promise.all(SEO_PAGE_KEYS.map(async (key) => [key, await getCodePageSeo(key, defaultLocale)] as const)),
  ]);
  const pageSeo = {} as LlmsInput["pages"];
  for (const [key, seo] of pages) pageSeo[key] = seo;
  return {
    content,
    description: settings.description || SITE.description,
    pages: pageSeo,
    aboutDescription: content.about?.seo.description || DEFAULT_ABOUT_SEO.description,
  };
};

type PageJsonLdOptions = Omit<PageGraphOptions, "locale" | "siteDescription" | "homeName">;

/** A page's structured data (lib/seo/structured-data.ts), in the reader's language. */
export const pageJsonLd = async (options: PageJsonLdOptions) => {
  const locale = await getLocale();
  const [settings, t] = await Promise.all([getSeoSettings(locale), getTranslations("Navigation")]);
  return pageGraph({
    ...options,
    locale,
    siteDescription: settings.description || SITE.description,
    homeName: t("home"),
  });
};

/** Structured data for a code-built page, named and described by its search text. */
export const codePageJsonLd = async (
  key: SeoPageKey,
  path: string,
  options: Omit<PageJsonLdOptions, "path" | "name" | "description" | "image"> & { values?: Record<string, string> } = {},
) => {
  const { values, ...rest } = options;
  const seo = await getCodePageSeo(key, await getLocale(), values);
  return pageJsonLd({ ...rest, path, name: seo.title, description: seo.description, image: seo.image });
};

/** A policy page's search text: its "Search and sharing" fields, else its header, else `fallback`. */
export const legalPageSeo = async (page: LegalPage | null, locale: string, fallback?: SeoText) => ({
  title: ownTitle(page?.seo.title ?? "") || page?.hero.title || fallback?.title || "",
  description: page?.seo.description || page?.hero.description || fallback?.description || "",
  image: firstShareImage(page?.seo.image) ?? (await siteShareImage(locale)),
});

/**
 * generateMetadata for a page whose title and description are UI copy in
 * messages/*.json, e.g. `["Insights", "pageTitle"]`.
 */
export const messagesPageMetadata = async (
  path: string,
  [titleNamespace, titleKey]: [string, string],
  [descriptionNamespace, descriptionKey]: [string, string],
): Promise<Metadata> => {
  const locale = await getLocale();
  const [tTitle, tDescription, image] = await Promise.all([
    getTranslations(titleNamespace),
    getTranslations(descriptionNamespace),
    siteShareImage(locale),
  ]);
  return pageMetadata({ path, locale, image, title: tTitle(titleKey), description: tDescription(descriptionKey) });
};
