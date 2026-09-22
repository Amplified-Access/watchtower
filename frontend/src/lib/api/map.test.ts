import { mapApi } from "./map";
import { api } from "./client";

jest.mock("./client", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

beforeEach(() => jest.clearAllMocks());

describe("mapApi.getPoints", () => {
  it("fetches without a query when there are no filters", () => {
    mapApi.getPoints();
    expect(mockApi.get).toHaveBeenCalledWith("/map/points");
  });

  it("encodes every filter", () => {
    mapApi.getPoints({
      category: "Police misconduct",
      excludeTypes: ["a", "b"],
      country: "Kenya",
      period: "7d",
      q: "  water ",
    });
    const url = new URL(mockApi.get.mock.calls[0][0] as string, "http://x");
    expect(url.pathname).toBe("/map/points");
    expect(url.searchParams.get("category")).toBe("Police misconduct");
    expect(url.searchParams.get("excludeTypes")).toBe("a,b");
    expect(url.searchParams.get("country")).toBe("Kenya");
    expect(url.searchParams.get("period")).toBe("7d");
    expect(url.searchParams.get("q")).toBe("water");
  });

  it("leaves out empty values", () => {
    mapApi.getPoints({ excludeTypes: [], q: "   ", from: "2026-09-01" });
    expect(mockApi.get).toHaveBeenCalledWith("/map/points?from=2026-09-01");
  });
});

describe("mapApi.getSummary", () => {
  it("uses the same filters", () => {
    mapApi.getSummary({ category: "Protests", period: "year" });
    expect(mockApi.get).toHaveBeenCalledWith("/map/summary?category=Protests&period=year");
  });
});

describe("mapApi.getReport", () => {
  it("encodes the id", () => {
    mapApi.getReport("a/b");
    expect(mockApi.get).toHaveBeenCalledWith("/map/reports/a%2Fb");
  });
});
