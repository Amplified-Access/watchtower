import { analyticsApi } from "./analytics";
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

describe("analyticsApi.queryIncidents", () => {
  it("fetches without a query when nothing is filtered", () => {
    analyticsApi.queryIncidents({});
    expect(mockApi.get).toHaveBeenCalledWith("/analytics/incidents");
  });

  it("encodes every parameter", () => {
    analyticsApi.queryIncidents({
      groupBy: "month",
      country: "Kenya",
      category: "Public demonstrations",
      from: "2026-01-01",
      to: "2026-03-31",
      q: "water",
      limit: 12,
    });
    const url = new URL(mockApi.get.mock.calls[0][0] as string, "http://x");
    expect(url.pathname).toBe("/analytics/incidents");
    expect(url.searchParams.get("groupBy")).toBe("month");
    expect(url.searchParams.get("country")).toBe("Kenya");
    expect(url.searchParams.get("category")).toBe("Public demonstrations");
    expect(url.searchParams.get("from")).toBe("2026-01-01");
    expect(url.searchParams.get("to")).toBe("2026-03-31");
    expect(url.searchParams.get("q")).toBe("water");
    expect(url.searchParams.get("limit")).toBe("12");
  });

  it("leaves out empty values", () => {
    analyticsApi.queryIncidents({ country: "", period: "30d" });
    expect(mockApi.get).toHaveBeenCalledWith("/analytics/incidents?period=30d");
  });
});

describe("analyticsApi.getOverview", () => {
  it("fetches the overview", () => {
    analyticsApi.getOverview();
    expect(mockApi.get).toHaveBeenCalledWith("/analytics/overview");
  });
});
