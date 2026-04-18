"use client";

import { useExtendedSession } from "./use-extended-session";

export type UserRole =
  | "super-admin"
  | "admin"
  | "watcher"
  | "independent-reporter";

export interface User {
  id: string;
  name: string;
  email: string;
  role?: UserRole;
  organizationId?: string;
}

/**
 * Hook to check if current user has any of the required roles
 */
export function useRoleCheck(allowedRoles: UserRole[]) {
  const { user, isLoading } = useExtendedSession();

  return {
    hasRole: user?.role ? allowedRoles.includes(user.role) : false,
    user,
    isLoading,
  };
}

/**
 * Hook to check if current user is super admin
 */
export function useIsSuperAdmin() {
  return useRoleCheck(["super-admin"]);
}

/**
 * Hook to check if current user is admin or super admin
 */
export function useIsAdmin() {
  return useRoleCheck(["admin", "super-admin"]);
}

/**
 * Hook to check if current user is watcher, admin, or super admin
 */
export function useIsWatcher() {
  return useRoleCheck(["watcher", "admin", "super-admin"]);
}

/**
 * Hook to check if current user belongs to an organization
 */
export function useHasOrganization() {
  const { user, isLoading } = useExtendedSession();

  return {
    hasOrganization: !!user?.organizationId,
    organizationId: user?.organizationId,
    user,
    isLoading,
  };
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role?: string): string {
  switch (role) {
    case "super-admin":
      return "Super Administrator";
    case "admin":
      return "Administrator";
    case "watcher":
      return "Watcher";
    case "independent-reporter":
      return "Independent Reporter";
    default:
      return "Unknown Role";
  }
}

/**
 * Get role color for UI display
 */
export function getRoleColor(role?: string): string {
  switch (role) {
    case "super-admin":
      return "bg-purple-100 text-purple-800";
    case "admin":
      return "bg-blue-100 text-blue-800";
    case "watcher":
      return "bg-green-100 text-green-800";
    case "independent-reporter":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
