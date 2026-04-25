import { reportsApi } from "./reports";
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

// ─── Public reports ───────────────────────────────────────────────────────────

describe("reportsApi.getPublicReports", () => {
  it("fetches /reports with no query when no params", () => {
    reportsApi.getPublicReports();
    expect(mockApi.get).toHaveBeenCalledWith("/reports");
  });

  it("appends limit and offset", () => {
    reportsApi.getPublicReports({ limit: 20, offset: 40 });
    const url: string = mockApi.get.mock.calls[0][0];
    expect(url).toContain("/reports?");
    expect(url).toContain("limit=20");
    expect(url).toContain("offset=40");
  });

  it("appends search query", () => {
    reportsApi.getPublicReports({ search: "climate" });
    const url: string = mockApi.get.mock.calls[0][0];
    expect(url).toContain("search=climate");
  });

  it("does not append empty search", () => {
    reportsApi.getPublicReports({ search: "" });
    const url: string = mockApi.get.mock.calls[0][0];
    expect(url).not.toContain("search=");
  });
});

describe("reportsApi.getPublicReportById", () => {
  it("fetches /reports/:id", () => {
    reportsApi.getPublicReportById("rep-1");
    expect(mockApi.get).toHaveBeenCalledWith("/reports/rep-1");
  });
});

// ─── Organisation reports ─────────────────────────────────────────────────────

describe("reportsApi.getOrganizationReports", () => {
  it("includes organizationId param", () => {
    reportsApi.getOrganizationReports("org-1");
    const url: string = mockApi.get.mock.calls[0][0];
    expect(url).toContain("/admin/reports");
    expect(url).toContain("organizationId=org-1");
  });

  it("appends status filter when provided", () => {
    reportsApi.getOrganizationReports("org-1", "published");
    const url: string = mockApi.get.mock.calls[0][0];
    expect(url).toContain("status=published");
  });

  it("omits status when not provided", () => {
    reportsApi.getOrganizationReports("org-1");
    const url: string = mockApi.get.mock.calls[0][0];
    expect(url).not.toContain("status=");
  });
});

describe("reportsApi.getReportById", () => {
  it("fetches /admin/reports/:id", () => {
    reportsApi.getReportById("rep-42");
    expect(mockApi.get).toHaveBeenCalledWith("/admin/reports/rep-42");
  });
});

// ─── CRUD ─────────────────────────────────────────────────────────────────────

describe("reportsApi.createReport", () => {
  it("posts to /admin/reports with all fields", () => {
    const data = { title: "Q1 Report", fileKey: "s3/key/report.pdf", status: "draft" };
    reportsApi.createReport(data);
    expect(mockApi.post).toHaveBeenCalledWith("/admin/reports", data);
  });

  it("posts without optional status", () => {
    const data = { title: "Q1 Report", fileKey: "s3/key/report.pdf" };
    reportsApi.createReport(data);
    expect(mockApi.post).toHaveBeenCalledWith("/admin/reports", data);
  });
});

describe("reportsApi.updateReport", () => {
  it("patches /admin/reports/:id with partial data", () => {
    reportsApi.updateReport("rep-5", { status: "published" });
    expect(mockApi.patch).toHaveBeenCalledWith("/admin/reports/rep-5", { status: "published" });
  });

  it("patches with title only", () => {
    reportsApi.updateReport("rep-5", { title: "New Title" });
    expect(mockApi.patch).toHaveBeenCalledWith("/admin/reports/rep-5", { title: "New Title" });
  });
});

describe("reportsApi.deleteReport", () => {
  it("calls delete on /admin/reports/:id", () => {
    reportsApi.deleteReport("rep-99");
    expect(mockApi.delete).toHaveBeenCalledWith("/admin/reports/rep-99");
  });
});

// ─── Super admin ──────────────────────────────────────────────────────────────

describe("reportsApi.getAllReports (super admin)", () => {
  it("fetches /superadmin/reports with no query by default", () => {
    reportsApi.getAllReports();
    expect(mockApi.get).toHaveBeenCalledWith("/superadmin/reports");
  });

  it("appends params when provided", () => {
    reportsApi.getAllReports({ limit: 5, offset: 0, search: "flood" });
    const url: string = mockApi.get.mock.calls[0][0];
    expect(url).toContain("/superadmin/reports?");
    expect(url).toContain("limit=5");
    expect(url).toContain("search=flood");
  });
});
