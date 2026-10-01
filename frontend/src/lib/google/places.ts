import "server-only";

// Location search for the report form, from Google's Places API (New):
// autocomplete suggestions while the reporter types, then the chosen place's
// coordinates, address and country. Called from tRPC (the `places` router),
// so GOOGLE_MAPS_API_KEY stays on the server.
//
// Billing follows Google's session model: the autocomplete requests and the
// one details request for the place picked share a session token (a UUID the
// browser makes per search), and are charged as one session.
// https://developers.google.com/maps/documentation/places/web-service/place-session-tokens

const AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";
const DETAILS_URL = "https://places.googleapis.com/v1/places/";
// Only what the form stores; the field mask also decides the price tier.
const DETAILS_FIELDS = "id,displayName,formattedAddress,location,addressComponents";

export interface PlaceSuggestion {
  placeId: string;
  /** The place's name, or the first part of the address ("Kampala Road"). */
  mainText: string;
  /** The rest, for telling places apart ("Kampala, Uganda"). */
  secondaryText: string;
}

export interface PlaceDetails {
  placeId: string;
  /** e.g. "Acacia Mall", or the street for a plain address. */
  name: string;
  /** The full address, in English. */
  address: string;
  /** The country's English name ("Uganda"), as the maps group reports by it. */
  country: string | null;
  latitude: number;
  longitude: number;
}

let warned = false;

// Read on each call rather than at import (see AGENTS.md: nothing tRPC imports
// may do work at import time).
const apiKey = () => {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key && !warned) {
    warned = true;
    console.warn("[places] GOOGLE_MAPS_API_KEY is not set, so location search returns nothing.");
  }
  return key;
};

const googleError = async (response: Response) => {
  const body = (await response.json().catch(() => null)) as { error?: { status?: string; message?: string } } | null;
  return new Error(
    `Places API ${response.status}${body?.error ? `: ${body.error.status} ${body.error.message}` : ""}`,
  );
};

type AutocompleteResponse = {
  suggestions?: {
    placePrediction?: {
      placeId: string;
      text?: { text: string };
      structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } };
    };
  }[];
};

/**
 * Suggestions for what the reporter has typed, in their language where Google
 * has it. Empty when the key isn't configured.
 */
export const autocompletePlaces = async ({
  input,
  sessionToken,
  languageCode,
}: {
  input: string;
  sessionToken: string;
  languageCode?: string;
}): Promise<PlaceSuggestion[]> => {
  const key = apiKey();
  if (!key) return [];

  const response = await fetch(AUTOCOMPLETE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key },
    body: JSON.stringify({ input, sessionToken, ...(languageCode ? { languageCode } : {}) }),
  });
  if (!response.ok) throw await googleError(response);

  const { suggestions = [] } = (await response.json()) as AutocompleteResponse;
  return suggestions.flatMap(({ placePrediction: prediction }) => {
    if (!prediction?.placeId) return [];
    const mainText = prediction.structuredFormat?.mainText?.text ?? prediction.text?.text ?? "";
    return [
      {
        placeId: prediction.placeId,
        mainText,
        secondaryText: prediction.structuredFormat?.secondaryText?.text ?? "",
      },
    ];
  });
};

type DetailsResponse = {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  addressComponents?: { longText: string; types: string[] }[];
};

/**
 * The chosen place, in English: reports are stored with an English address
 * and country name whatever language the reporter searched in. Null when the
 * key isn't configured or the place has no coordinates.
 */
export const getPlaceDetails = async ({
  placeId,
  sessionToken,
}: {
  placeId: string;
  sessionToken: string;
}): Promise<PlaceDetails | null> => {
  const key = apiKey();
  if (!key) return null;

  const url = new URL(`${DETAILS_URL}${encodeURIComponent(placeId)}`);
  url.searchParams.set("sessionToken", sessionToken);
  url.searchParams.set("languageCode", "en");
  const response = await fetch(url, {
    headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": DETAILS_FIELDS },
  });
  if (!response.ok) throw await googleError(response);

  const place = (await response.json()) as DetailsResponse;
  if (!place.location) return null;
  const address = place.formattedAddress ?? place.displayName?.text ?? "";
  return {
    placeId: place.id,
    name: place.displayName?.text ?? address,
    address,
    country: place.addressComponents?.find((part) => part.types.includes("country"))?.longText ?? null,
    latitude: place.location.latitude,
    longitude: place.location.longitude,
  };
};
