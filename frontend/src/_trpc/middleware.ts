import { TRPCError } from "@trpc/server";
import { cookies } from "next/headers";
import { publicProcedure } from "./trpc";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

async function extractToken(): Promise<string | null> {
  try {
    const store = await cookies();
    return store.get("better-auth.session_token")?.value ?? null;
  } catch {
    return null;
  }
}

async function getUserFromGoBackend(token: string) {
  const res = await fetch(`${API_BASE}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });
  if (!res.ok) return null;
  const body = await res.json();
  return body.data ?? null;
}

export const authMiddleware = publicProcedure.use(async ({ next }) => {
  const token = await extractToken();
  if (!token) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "No session token found",
    });
  }

  const goUser = await getUserFromGoBackend(token);
  if (!goUser) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid or expired session",
    });
  }

  return next({
    ctx: {
      user: goUser,
    },
  });
});

export const requireRole = (allowedRoles: string[]) => {
  return authMiddleware.use(async ({ next, ctx }) => {
    if (!ctx.user.role || !allowedRoles.includes(ctx.user.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Access denied. Required roles: ${allowedRoles.join(", ")}`,
      });
    }
    return next({ ctx });
  });
};

export const requireOrganizationMembership = authMiddleware.use(
  async ({ next, ctx }) => {
    const user = ctx.user as typeof ctx.user & { organizationId?: string };
    if (!user.organizationId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "You must be associated with an organization to access this resource",
      });
    }
    return next({
      ctx: {
        ...ctx,
        organizationId: user.organizationId,
      },
    });
  },
);

export const requireSuperAdmin = requireRole(["super-admin"]);
export const requireAdmin = requireRole(["admin", "super-admin"]);
export const requireWatcherOrAdmin = requireRole([
  "watcher",
  "admin",
  "super-admin",
]);
export const requireAuth = authMiddleware;

export const protectedProcedure = authMiddleware;
export const superAdminProcedure = requireSuperAdmin;
export const adminProcedure = requireAdmin;
export const watcherProcedure = requireWatcherOrAdmin;
export const organizationProcedure = requireOrganizationMembership;
