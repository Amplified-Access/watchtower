const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export class ApiError {
  constructor(
    public status: number,
    public message: string,
    public data?: unknown
  ) {}

  static async fromResponse(res: Response): Promise<ApiError> {
    let message = `HTTP ${res.status}`;
    let data: unknown;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
      data = body;
    } catch {
      message = res.statusText || message;
    }
    return new ApiError(res.status, message, data);
  }
}

export class ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  total: number | undefined;

  private constructor(res: { success: boolean; data?: T; error?: string; total?: number }) {
    this.success = res.success;
    this.data = res.data ?? null;
    this.error = res.error ?? null;
    this.total = res.total;
  }

  static async fromFetch<T>(res: Response): Promise<ApiResponse<T>> {
    if (!res.ok) {
      const err = await ApiError.fromResponse(res);
      return { success: false, error: err.message } as ApiResponse<T>;
    }
    const body = await res.json();
    return new ApiResponse<T>({
      success: body.success ?? true,
      data: body.data,
      error: body.error ?? null,
      total: body.total,
    });
  }
}

type RequestOptions = {
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
    signal: options.signal,
    credentials: "include",
  });

  return ApiResponse.fromFetch<T>(res);
}

async function getToken(): Promise<string | null> {
  if (typeof document === "undefined") {
    try {
      const { cookies } = await import("next/headers");
      const store = await cookies();
      return store.get("better-auth.session_token")?.value ?? null;
    } catch {
      return null;
    }
  }
  const cookieList = document.cookie.split(";");
  for (const cookie of cookieList) {
    const [key, val] = cookie.trim().split("=");
    if (key === "better-auth.session_token") return decodeURIComponent(val ?? "");
  }
  return null;
}

export const api = {
  get<T>(path: string, options?: RequestOptions) {
    return request<T>("GET", path, undefined, options);
  },

  post<T>(path: string, body?: unknown, options?: RequestOptions) {
    return request<T>("POST", path, body, options);
  },

  put<T>(path: string, body?: unknown, options?: RequestOptions) {
    return request<T>("PUT", path, body, options);
  },

  patch<T>(path: string, body?: unknown, options?: RequestOptions) {
    return request<T>("PATCH", path, body, options);
  },

  delete<T>(path: string, options?: RequestOptions) {
    return request<T>("DELETE", path, undefined, options);
  },
};
