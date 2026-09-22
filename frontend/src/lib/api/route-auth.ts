import "server-only";
import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export interface RouteUser {
  id: string;
  role: string;
  organizationId?: string;
}

// For Next route handlers, which sit outside tRPC and so don't get its auth
// middleware. The Go backend is the source of truth for sessions: this only
// forwards the session cookie to /me, the same check tRPC's authMiddleware does.
export async function getRouteUser(): Promise<RouteUser | null> {
  try {
    const token = (await cookies()).get("better-auth.session_token")?.value;
    if (!token) return null;
    const res = await fetch(`${API_BASE}/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body.data ?? null;
  } catch {
    return null;
  }
}
