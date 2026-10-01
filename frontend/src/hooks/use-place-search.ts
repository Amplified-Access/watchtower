"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { trpc } from "@/_trpc/client";
import { locales, type Locale } from "@/i18n/locales";

// Debounce and minimum length before searching, as in Blaze's address search:
// Google is only asked once the reporter pauses, and not for one or two letters.
const SEARCH_DEBOUNCE_MS = 300;
export const MIN_PLACE_QUERY_LENGTH = 3;

const newSessionToken = () => crypto.randomUUID();

/**
 * Google location search (the `places` tRPC router) for any form: suggestions
 * for the text in `query`, and `select` to fetch a suggestion's coordinates,
 * address and country. The form renders its own input and list.
 *
 * One session token covers the typing and the place picked, so Google bills
 * the search as a single session; a new one starts after each selection.
 */
export function usePlaceSearch() {
  const locale = useLocale();
  const utils = trpc.useUtils();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  // Only ever sent to Google, never rendered, so the server and browser
  // making different ones doesn't matter.
  const [sessionToken, setSessionToken] = useState(newSessionToken);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);

  const languageCode = (locales as readonly string[]).includes(locale) ? (locale as Locale) : undefined;
  const search = trpc.places.autocomplete.useQuery(
    { input: debounced, sessionToken, languageCode },
    { enabled: debounced.length >= MIN_PLACE_QUERY_LENGTH, staleTime: 5 * 60 * 1000 },
  );

  const select = async (placeId: string) => {
    try {
      return await utils.places.details.fetch({ placeId, sessionToken }, { staleTime: Infinity });
    } finally {
      // The details request ends the session; the next search starts a new one.
      setSessionToken(newSessionToken());
    }
  };

  const trimmed = query.trim();
  return {
    query,
    setQuery,
    suggestions: search.data ?? [],
    /** Too short to search yet. */
    tooShort: trimmed.length < MIN_PLACE_QUERY_LENGTH,
    /** Waiting for the debounce or for Google. */
    isSearching: debounced !== trimmed || search.isFetching,
    select,
  };
}
