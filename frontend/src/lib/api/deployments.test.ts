import { deploymentsApi } from "./deployments";
import { api } from "./client";

jest.mock("./client", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

const mockApi = api as jest.Mocked<typeof api>;

beforeEach(() => jest.clearAllMocks());

describe("deploymentsApi", () => {
  it("lists the admin's own deployments", () => {
    deploymentsApi.getOrganizationDeployments();
    expect(mockApi.get).toHaveBeenCalledWith("/admin/deployments");
  });

  it("reads the admin's deployment numbers", () => {
    deploymentsApi.getOrganizationStats();
    expect(mockApi.get).toHaveBeenCalledWith("/admin/deployments/stats");
  });

  it("creates a deployment", () => {
    const body = { name: "Uganda 2026 elections", incidentTypeIds: ["t1"] };
    deploymentsApi.create(body);
    expect(mockApi.post).toHaveBeenCalledWith("/admin/deployments", body);
  });

  it("changes a deployment's status", () => {
    deploymentsApi.updateStatus("d 1", "live");
    expect(mockApi.patch).toHaveBeenCalledWith("/admin/deployments/d%201/status", { status: "live" });
  });

  it("reads a public deployment by its slug", () => {
    deploymentsApi.getPublic("uganda-2026");
    expect(mockApi.get).toHaveBeenCalledWith("/deployments/uganda-2026");
  });

  it("lists every deployment for the super admin", () => {
    deploymentsApi.getAll();
    expect(mockApi.get).toHaveBeenCalledWith("/superadmin/deployments");
  });

  it("narrows the super admin's list to one organization", () => {
    deploymentsApi.getAll("org 1");
    expect(mockApi.get).toHaveBeenCalledWith("/superadmin/deployments?organizationId=org%201");
  });
});
