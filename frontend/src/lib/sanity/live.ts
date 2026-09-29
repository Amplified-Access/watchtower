import "server-only";
import { createClient, type QueryParams } from "next-sanity";
import { defineLive } from "next-sanity/live";
import { dataset, projectId } from "@/sanity/env";

// Editorial content (case studies, legal pages) lives in Sanity, not the Go
// backend: it is public, read-only, and edited in the Studio embedded at
// /studio. Server components read it through this module; it never reaches
// tRPC or the browser.
//
// Sanity Live keeps it fresh. Every `sanityFetch` result is cached under the
// sync tags Sanity returns with it, and <SanityLive /> (rendered on the pages
// that show Sanity content) listens to the Live Content API from the browser:
// when a document is published, it revalidates just the affected tags and
// refreshes the page, for that reader and everyone after. Two fallbacks
// cover the time no reader has a page open: the Sanity webhook
// (/api/revalidate) drops the `sanity` tag every fetch also carries, and
// fetches expire after a minute regardless.
//
// The dataset is public, so published documents are read without a token.
// Drafts are never visible here.

export const SANITY_API_VERSION = "2025-10-15";

/** Tag on every Sanity fetch (defineLive's default), revalidated by the webhook. */
export const SANITY_CACHE_TAG = "sanity";

// Nothing is fetched or opened here: the client and defineLive only hold
// configuration. Without a project there is nothing to define, and the pages
// render empty rather than failing at import (see AGENTS.md).
const live = projectId
  ? defineLive({
      client: createClient({
        projectId,
        dataset,
        apiVersion: SANITY_API_VERSION,
        // Next's data cache does the caching; reading past Sanity's API CDN
        // means a revalidated fetch never gets a CDN copy of the old content.
        useCdn: false,
        perspective: "published",
      }),
      fetchOptions: { revalidate: 60 },
    })
  : null;

let warned = false;

/** Runs a GROQ query, or returns null when Sanity isn't configured. */
export const sanityFetch = async <T>(query: string, params: QueryParams = {}): Promise<T | null> => {
  if (!live) {
    if (!warned) {
      warned = true;
      console.warn(
        "[sanity] NEXT_PUBLIC_SANITY_PROJECT_ID is not set, so case studies and legal pages render empty. See docs/CMS.md.",
      );
    }
    return null;
  }
  const { data } = await live.sanityFetch({ query, params, tags: [SANITY_CACHE_TAG] });
  return data as T;
};

/**
 * Subscribes the reader's browser to Sanity's Live Content API. Render it once
 * on every page that shows Sanity content; it renders nothing visible.
 */
export const SanityLive = live?.SanityLive ?? (() => null);
