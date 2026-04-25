import { incidentsApi } from "./incidents";
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

// ─── Incident types ──────────────────────────────────────────────────────────

describe("incidentsApi.getAllTypes", () => {
  it("fetches active types by default", () => {
    incidentsApi.getAllTypes();
    expect(mockApi.get).toHaveBeenCalledWith("/incident-types?activeOnly=true");
  });

  it("fetches all types when activeOnly=false", () => {
    incidentsApi.getAllTypes(false);
    expect(mockApi.get).toHaveBeenCalledWith("/incident-types?activeOnly=false");
  });
});

describe("incidentsApi.getTypesByOrganization", () => {
  it("includes organizationId in query", () => {
    incidentsApi.getTypesByOrganization("org-1");
    expect(mockApi.get).toHaveBeenCalledWith("/admin/incident-types?organizationId=org-1");
  });
});

describe("incidentsApi.enableType / disableType", () => {
  it("posts to enable endpoint with orgId query param", () => {
    incidentsApi.enableType("org-1", "type-5");
    expect(mockApi.post).toHaveBeenCalledWith("/admin/incident-types/type-5/enable?organizationId=org-1");
  });

  it("posts to disable endpoint", () => {
    incidentsApi.disableType("org-1", "type-5");
    expect(mockApi.post).toHaveBeenCalledWith("/admin/incident-types/type-5/disable?organizationId=org-1");
  });
});

// ─── Incidents ───────────────────────────────────────────────────────────────

describe("incidentsApi.getOrganizationIncidents", () => {
  it("includes organizationId and no extra params by default", () => {
    incidentsApi.getOrganizationIncidents("org-1");
    const url: string = mockApi.get.mock.calls[0][0];
    expect(url).toContain("organizationId=org-1");
  });

  it("appends limit and offset when provided", () => {
    incidentsApi.getOrganizationIncidents("org-1", { limit: 10, offset: 20 });
    const url: string = mockApi.get.mock.calls[0][0];
    expect(url).toContain("limit=10");
    expect(url).toContain("offset=20");
  });

  it("appends search when provided", () => {
    incidentsApi.getOrganizationIncidents("org-1", { search: "fire" });
    const url: string = mockApi.get.mock.calls[0][0];
    expect(url).toContain("search=fire");
  });

  it("appends sort and sortOrder when provided", () => {
    incidentsApi.getOrganizationIncidents("org-1", { sort: "createdAt", sortOrder: "desc" });
    const url: string = mockApi.get.mock.calls[0][0];
    expect(url).toContain("sort=createdAt");
    expect(url).toContain("sortOrder=desc");
  });

  it("omits params with falsy values", () => {
    incidentsApi.getOrganizationIncidents("org-1", { limit: 0 });
    const url: string = mockApi.get.mock.calls[0][0];
    expect(url).not.toContain("limit=");
  });
});

describe("incidentsApi.getIncidentById", () => {
  it("fetches from correct path", () => {
    incidentsApi.getIncidentById("inc-42");
    expect(mockApi.get).toHaveBeenCalledWith("/admin/incidents/inc-42");
  });
});

describe("incidentsApi.updateIncidentStatus", () => {
  it("patches with status body", () => {
    incidentsApi.updateIncidentStatus("inc-42", "resolved");
    expect(mockApi.patch).toHaveBeenCalledWith("/admin/incidents/inc-42/status", { status: "resolved" });
  });
});

describe("incidentsApi.submitIncident", () => {
  it("posts to /incidents with watcher data", () => {
    const data = { formId: "form-1", data: { field: "value" } };
    incidentsApi.submitIncident(data);
    expect(mockApi.post).toHaveBeenCalledWith("/incidents", data);
  });
});

describe("incidentsApi.submitAnonymousReport", () => {
  it("posts to /incidents/anonymous", () => {
    const data = {
      incidentTypeId: "type-1",
      location: { latitude: 1.23, longitude: 4.56 },
      description: "An incident occurred",
    };
    incidentsApi.submitAnonymousReport(data);
    expect(mockApi.post).toHaveBeenCalledWith("/incidents/anonymous", data);
  });
});

// ─── Analytics ───────────────────────────────────────────────────────────────

describe("incidentsApi.getOrganizationStats", () => {
  it("fetches from analytics stats endpoint", () => {
    incidentsApi.getOrganizationStats("org-1");
    expect(mockApi.get).toHaveBeenCalledWith("/admin/analytics/stats?organizationId=org-1");
  });
});

describe("incidentsApi.getDashboardStats", () => {
  it("fetches from dashboard endpoint", () => {
    incidentsApi.getDashboardStats("org-1");
    expect(mockApi.get).toHaveBeenCalledWith("/admin/dashboard?organizationId=org-1");
  });
});

describe("incidentsApi.getHeatmapData", () => {
  it("fetches from heatmap endpoint", () => {
    incidentsApi.getHeatmapData();
    expect(mockApi.get).toHaveBeenCalledWith("/incidents/heatmap");
  });
});

// ─── Super admin ─────────────────────────────────────────────────────────────

describe("incidentsApi.getAllIncidents (super admin)", () => {
  it("fetches all without query when no params", () => {
    incidentsApi.getAllIncidents();
    expect(mockApi.get).toHaveBeenCalledWith("/superadmin/incidents");
  });

  it("appends query string when params provided", () => {
    incidentsApi.getAllIncidents({ limit: 5, offset: 10, search: "assault" });
    const url: string = mockApi.get.mock.calls[0][0];
    expect(url).toContain("/superadmin/incidents?");
    expect(url).toContain("limit=5");
    expect(url).toContain("offset=10");
    expect(url).toContain("search=assault");
  });
});

describe("incidentsApi.deleteIncident", () => {
  it("calls delete on superadmin endpoint", () => {
    incidentsApi.deleteIncident("inc-99");
    expect(mockApi.delete).toHaveBeenCalledWith("/superadmin/incidents/inc-99");
  });
});

// ─── Anonymous reports ───────────────────────────────────────────────────────

describe("incidentsApi.getAnonymousReports", () => {
  it("fetches without query when no params", () => {
    incidentsApi.getAnonymousReports();
    expect(mockApi.get).toHaveBeenCalledWith("/incidents/anonymous");
  });

  it("appends country and category filters", () => {
    incidentsApi.getAnonymousReports({ country: "NG", category: "flood" });
    const url: string = mockApi.get.mock.calls[0][0];
    expect(url).toContain("country=NG");
    expect(url).toContain("category=flood");
  });
});
