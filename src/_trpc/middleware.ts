import { TRPCError } from "@trpc/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { publicProcedure } from "./trpc";
import { createAuthUseCases, AuthUserNotFoundError } from "@/features/auth";

const authUseCases = createAuthUseCases();

/**
 * Auth middleware that checks if user is authenticated
 */
export const authMiddleware = publicProcedure.use(async ({ next }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  let fullUser;
  try {
    fullUser = await authUseCases.getAuthUserById.execute(session.user.id);
  } catch (error) {
    if (error instanceof AuthUserNotFoundError) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not found in database",
      });
    }
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to verify user identity",
    });
  }

  return next({
    ctx: {
      session,
      user: {
        ...session.user,
        role: fullUser.role,
        organizationId: fullUser.organizationId,
        banned: fullUser.banned,
        banReason: fullUser.banReason,
        banExpires: fullUser.banExpires,
      },
    },
  });
});

/**
 * Role-based middleware factory
 */
export const requireRole = (allowedRoles: string[]) => {
  return authMiddleware.use(async ({ next, ctx }) => {
    if (!ctx.user.role || !allowedRoles.includes(ctx.user.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Access denied. Required roles: ${allowedRoles.join(", ")}`,
      });
    }

    return next({
      ctx,
    });
  });
};

/**
 * Organization membership middleware - ensures user belongs to the organization
 */
export const requireOrganizationMembership = authMiddleware.use(
  async ({ next, ctx }) => {
    // Cast user to include organizationId since it exists in the schema
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

/**
 * Super admin only middleware
 */
export const requireSuperAdmin = requireRole(["super-admin"]);

/**
 * Admin or Super admin middleware
 */
export const requireAdmin = requireRole(["admin", "super-admin"]);

/**
 * Watcher, Admin, or Super admin middleware
 */
export const requireWatcherOrAdmin = requireRole([
  "watcher",
  "admin",
  "super-admin",
]);

/**
 * Any authenticated user middleware
 */
export const requireAuth = authMiddleware;

// Procedure builders with middleware applied
export const protectedProcedure = authMiddleware;
export const superAdminProcedure = requireSuperAdmin;
export const adminProcedure = requireAdmin;
export const watcherProcedure = requireWatcherOrAdmin;
export const organizationProcedure = requireOrganizationMembership;
