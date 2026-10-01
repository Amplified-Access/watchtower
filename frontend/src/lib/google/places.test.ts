/**
 * @jest-environment node
 */
jest.mock("server-only", () => ({}));

import { autocompletePlaces, getPlaceDetails } from "./places";

const fetchMock = jest.fn();
const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock;
  process.env.GOOGLE_MAPS_API_KEY = "test-key";
});

afterAll(() => {
  delete process.env.GOOGLE_MAPS_API_KEY;
});

const TOKEN = "6f1d3c2a-0c7e-4f7a-9d55-3b8a2f0e9c11";

describe("autocompletePlaces", () => {
  it("asks Google with the key, session token and reader's language", async () => {
    fetchMock.mockReturnValue(json({ suggestions: [] }));
    await autocompletePlaces({ input: "Kampala Road", sessionToken: TOKEN, languageCode: "sw" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://places.googleapis.com/v1/places:autocomplete");
    expect(init.headers["X-Goog-Api-Key"]).toBe("test-key");
    expect(JSON.parse(init.body)).toEqual({ input: "Kampala Road", sessionToken: TOKEN, languageCode: "sw" });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("returns each prediction's main and secondary text", async () => {
    fetchMock.mockReturnValue(
      json({
        suggestions: [
          {
            placePrediction: {
              placeId: "a",
              text: { text: "Kampala Road, Kampala, Uganda" },
              structuredFormat: { mainText: { text: "Kampala Road" }, secondaryText: { text: "Kampala, Uganda" } },
            },
          },
          { placePrediction: { placeId: "b", text: { text: "Uganda" } } },
          { queryPrediction: { text: { text: "kampala road shops" } } },
        ],
      }),
    );
    expect(await autocompletePlaces({ input: "Kampala Road", sessionToken: TOKEN })).toEqual([
      { placeId: "a", mainText: "Kampala Road", secondaryText: "Kampala, Uganda" },
      { placeId: "b", mainText: "Uganda", secondaryText: "" },
    ]);
  });

  it("throws Google's error so the router can log it", async () => {
    fetchMock.mockReturnValue(json({ error: { status: "PERMISSION_DENIED", message: "API not enabled" } }, 403));
    await expect(autocompletePlaces({ input: "Kampala", sessionToken: TOKEN })).rejects.toThrow(
      "Places API 403: PERMISSION_DENIED API not enabled",
    );
  });

  it("returns nothing, without calling Google, when the key isn't set", async () => {
    delete process.env.GOOGLE_MAPS_API_KEY;
    jest.spyOn(console, "warn").mockImplementation(() => {});
    expect(await autocompletePlaces({ input: "Kampala", sessionToken: TOKEN })).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("getPlaceDetails", () => {
  it("asks for the stored fields in English, in the same session", async () => {
    fetchMock.mockReturnValue(json({ id: "a", location: { latitude: 0.31, longitude: 32.58 } }));
    await getPlaceDetails({ placeId: "a", sessionToken: TOKEN });

    const [url, init] = fetchMock.mock.calls[0];
    const parsed = new URL(url);
    expect(parsed.pathname).toBe("/v1/places/a");
    expect(parsed.searchParams.get("sessionToken")).toBe(TOKEN);
    expect(parsed.searchParams.get("languageCode")).toBe("en");
    expect(init.headers["X-Goog-FieldMask"]).toBe("id,displayName,formattedAddress,location,addressComponents");
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("returns coordinates, address and the country from the address components", async () => {
    fetchMock.mockReturnValue(
      json({
        id: "a",
        displayName: { text: "Kampala Road" },
        formattedAddress: "Kampala Rd, Kampala, Uganda",
        location: { latitude: 0.3136, longitude: 32.5811 },
        addressComponents: [
          { longText: "Kampala", types: ["locality", "political"] },
          { longText: "Uganda", types: ["country", "political"] },
        ],
      }),
    );
    expect(await getPlaceDetails({ placeId: "a", sessionToken: TOKEN })).toEqual({
      placeId: "a",
      name: "Kampala Road",
      address: "Kampala Rd, Kampala, Uganda",
      country: "Uganda",
      latitude: 0.3136,
      longitude: 32.5811,
    });
  });

  it("has no country when Google gives none, and no place without coordinates", async () => {
    fetchMock.mockReturnValueOnce(json({ id: "a", formattedAddress: "Somewhere", location: { latitude: 1, longitude: 2 } }));
    expect((await getPlaceDetails({ placeId: "a", sessionToken: TOKEN }))?.country).toBeNull();

    fetchMock.mockReturnValueOnce(json({ id: "b", formattedAddress: "Nowhere" }));
    expect(await getPlaceDetails({ placeId: "b", sessionToken: TOKEN })).toBeNull();
  });
});
