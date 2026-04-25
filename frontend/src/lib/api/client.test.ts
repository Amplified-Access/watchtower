import { ApiError, ApiResponse, api } from "./client";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

// ─── Helpers ────────────────────────────────────────────────────────────────

function mockFetch(status: number, body: unknown, ok = status >= 200 && status < 300) {
  const json = jest.fn().mockResolvedValue(body);
  const res = { ok, status, statusText: `Status ${status}`, json } as unknown as Response;
  global.fetch = jest.fn().mockResolvedValue(res);
  return { json, res };
}

function setCookie(value: string) {
  Object.defineProperty(document, "cookie", {
    writable: true,
    configurable: true,
    value,
  });
}

// ─── ApiError ───────────────────────────────────────────────────────────────

describe("ApiError.fromResponse", () => {
  it("extracts message from body.error", async () => {
    const res = { ok: false, status: 400, statusText: "Bad Request", json: jest.fn().mockResolvedValue({ error: "Invalid input" }) } as unknown as Response;
    const err = await ApiError.fromResponse(res);
    expect(err.status).toBe(400);
    expect(err.message).toBe("Invalid input");
    expect(err.data).toEqual({ error: "Invalid input" });
  });

  it("falls back to statusText when body has no error field", async () => {
    const res = { ok: false, status: 503, statusText: "Service Unavailable", json: jest.fn().mockResolvedValue({}) } as unknown as Response;
    const err = await ApiError.fromResponse(res);
    expect(err.message).toBe("HTTP 503");
  });

  it("falls back to statusText when body is not JSON", async () => {
    const res = { ok: false, status: 503, statusText: "Service Unavailable", json: jest.fn().mockRejectedValue(new SyntaxError("invalid json")) } as unknown as Response;
    const err = await ApiError.fromResponse(res);
    expect(err.message).toBe("Service Unavailable");
  });

  it("sets message to HTTP <status> when statusText is empty and no json error", async () => {
    const res = { ok: false, status: 500, statusText: "", json: jest.fn().mockRejectedValue(new SyntaxError()) } as unknown as Response;
    const err = await ApiError.fromResponse(res);
    expect(err.message).toBe("HTTP 500");
  });
});

// ─── ApiResponse ────────────────────────────────────────────────────────────

describe("ApiResponse.fromFetch", () => {
  it("returns success response with data", async () => {
    const body = { success: true, data: { id: "1", name: "Test" } };
    const res = { ok: true, status: 200, json: jest.fn().mockResolvedValue(body) } as unknown as Response;
    const result = await ApiResponse.fromFetch<{ id: string; name: string }>(res);
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ id: "1", name: "Test" });
    expect(result.error).toBeNull();
  });

  it("returns success response with total", async () => {
    const body = { success: true, data: [], total: 42 };
    const res = { ok: true, status: 200, json: jest.fn().mockResolvedValue(body) } as unknown as Response;
    const result = await ApiResponse.fromFetch<unknown[]>(res);
    expect(result.total).toBe(42);
  });

  it("assumes success=true when body omits the field", async () => {
    const body = { data: { value: 1 } };
    const res = { ok: true, status: 200, json: jest.fn().mockResolvedValue(body) } as unknown as Response;
    const result = await ApiResponse.fromFetch<{ value: number }>(res);
    expect(result.success).toBe(true);
  });

  it("returns error response from non-ok fetch", async () => {
    const res = { ok: false, status: 401, statusText: "Unauthorized", json: jest.fn().mockResolvedValue({ error: "Token expired" }) } as unknown as Response;
    const result = await ApiResponse.fromFetch(res);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Token expired");
  });
});

// ─── api methods (request) ──────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  setCookie("");
});

describe("api.get", () => {
  it("calls fetch with GET method and correct URL", async () => {
    mockFetch(200, { success: true, data: [] });
    await api.get("/incidents");
    expect(global.fetch).toHaveBeenCalledWith(
      `${BASE}/incidents`,
      expect.objectContaining({ method: "GET" })
    );
  });

  it("includes Content-Type: application/json header", async () => {
    mockFetch(200, { success: true, data: {} });
    await api.get("/me");
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers["Content-Type"]).toBe("application/json");
  });

  it("includes Authorization header when session cookie is set", async () => {
    setCookie("better-auth.session_token=abc123");
    mockFetch(200, { success: true, data: {} });
    await api.get("/me");
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers["Authorization"]).toBe("Bearer abc123");
  });

  it("omits Authorization header when no session cookie", async () => {
    setCookie("other-cookie=value");
    mockFetch(200, { success: true, data: {} });
    await api.get("/me");
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers["Authorization"]).toBeUndefined();
  });

  it("does not send a request body", async () => {
    mockFetch(200, { success: true, data: {} });
    await api.get("/incidents");
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.body).toBeUndefined();
  });
});

describe("api.post", () => {
  it("calls fetch with POST method", async () => {
    mockFetch(201, { success: true, data: { id: "new" } });
    await api.post("/incidents", { formId: "f1", data: {} });
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.method).toBe("POST");
  });

  it("serializes body as JSON", async () => {
    mockFetch(201, { success: true, data: {} });
    const payload = { formId: "f1", data: { key: "value" } };
    await api.post("/incidents", payload);
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.body).toBe(JSON.stringify(payload));
  });

  it("sends no body when none is provided", async () => {
    mockFetch(200, { success: true, data: {} });
    await api.post("/action");
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.body).toBeUndefined();
  });
});

describe("api.patch", () => {
  it("calls fetch with PATCH method and serialized body", async () => {
    mockFetch(200, { success: true, data: {} });
    await api.patch("/incidents/1/status", { status: "resolved" });
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.method).toBe("PATCH");
    expect(init.body).toBe(JSON.stringify({ status: "resolved" }));
  });
});

describe("api.put", () => {
  it("calls fetch with PUT method", async () => {
    mockFetch(200, { success: true, data: {} });
    await api.put("/resource/1", { name: "updated" });
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.method).toBe("PUT");
  });
});

describe("api.delete", () => {
  it("calls fetch with DELETE method and no body", async () => {
    mockFetch(200, { success: true, data: null });
    await api.delete("/incidents/1");
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(`${BASE}/incidents/1`);
    expect(init.method).toBe("DELETE");
    expect(init.body).toBeUndefined();
  });
});

describe("token extraction from cookie", () => {
  it("decodes URI-encoded token value", async () => {
    setCookie("better-auth.session_token=token%2Fwith%2Fslashes");
    mockFetch(200, { success: true, data: {} });
    await api.get("/me");
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers["Authorization"]).toBe("Bearer token/with/slashes");
  });

  it("finds token when mixed with other cookies", async () => {
    setCookie("theme=dark; better-auth.session_token=mytoken; lang=en");
    mockFetch(200, { success: true, data: {} });
    await api.get("/me");
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers["Authorization"]).toBe("Bearer mytoken");
  });
});
