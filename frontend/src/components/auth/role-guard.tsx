"use client";

import { UserRole, useRoleCheck } from "@/hooks/use-role-check";

/**
 * Component guard that only renders children if user has required roles
 */
interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({
  allowedRoles,
  children,
  fallback = null,
}: RoleGuardProps) {
  const { hasRole } = useRoleCheck(allowedRoles);

  if (!hasRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
