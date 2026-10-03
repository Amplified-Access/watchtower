import type { Metadata } from "next";
import { SHARE_IMAGE_SIZE } from "@/lib/sanity/image";
import { abs, ogLocale, SITE } from "./site";

// Builds a page's <head>: title, description, canonical URL, Open Graph and
// X (Twitter) cards. Every public page goes through it, so they all describe
// themselves the same way.
//
// Next merges metadata shallowly: a page's `openGraph` replaces the layout's
// whole `openGraph`, it doesn't add to it. That is why the site name, locale
// and image are set again here for every page rather than inherited.

export type PageMetadataInput = {
  /** The page's address, e.g. "/maps". Becomes the canonical URL. */
  path: string;
  /** The page's own title, without "WatchTower". */
  title: string;
  description: string;
  locale: string;
  /** Absolute URL or site path of the share image; the site's banner when absent. */
  image?: string | null;
  type?: "website" | "article";
  /** For articles (case studies). */
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  /** The home page puts the brand first: "WatchTower | <title>". */
  home?: boolean;
  /** Pages that shouldn't appear in search results (password reset, a chat thread). */
  noindex?: boolean;
};

const BRAND = new RegExp(`\\s*[|:·\\-\\u2013\\u2014]\\s*${SITE.name}\\s*$`, "i");

/**
 * A page's own title, without a brand suffix an editor typed ("Security
 * Policy | WatchTower"): what structured data and breadcrumbs name the page.
 */
export const ownTitle = (title: string) => title.replace(BRAND, "").trim();

/**
 * The title as shown in the tab and search results: the brand is added back
 * the same way everywhere. A title naming the brand anywhere else ("Ask
 * WatchTower") is used as it is.
 */
export const fullTitle = (title: string, { home = false } = {}) => {
  const own = ownTitle(title);
  if (!own) return SITE.title;
  if (home) return `${SITE.name} | ${own}`;
  return own.toLowerCase().includes(SITE.name.toLowerCase()) ? own : `${own} | ${SITE.name}`;
};

/** Replaces `{name}` placeholders, e.g. the incident type in "{type} map". */
export const fillPlaceholders = (text: string, values: Record<string, string>) =>
  text.replace(/\{(\w+)\}/g, (whole, name: string) => values[name] ?? whole);

export const pageMetadata = ({
  path,
  title,
  description,
  locale,
  image,
  type = "website",
  publishedTime,
  modifiedTime,
  section,
  home,
  noindex,
}: PageMetadataInput): Metadata => {
  const shown = fullTitle(title, { home });
  const url = abs(path);
  const imageUrl = abs(image || SITE.image);
  return {
    // Absolute, so the layout's "%s | WatchTower" template doesn't add the
    // brand a second time, and the tab and the share card read the same.
    title: { absolute: shown },
    description,
    alternates: { canonical: url },
    openGraph: {
      type,
      url,
      siteName: SITE.name,
      title: shown,
      description,
      locale: ogLocale(locale),
      images: [{ url: imageUrl, ...SHARE_IMAGE_SIZE, alt: shown }],
      ...(type === "article" && { publishedTime, modifiedTime, section }),
    },
    twitter: {
      card: "summary_large_image",
      title: shown,
      description,
      images: [imageUrl],
    },
    ...(noindex && { robots: { index: false, follow: true } }),
  };
};
