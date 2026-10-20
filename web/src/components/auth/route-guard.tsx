"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useExtendedSession } from "@/hooks/use-extended-session";
import Loader from "@/components/common/loader";

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireOrganization?: boolean;
  fallbackPath?: string;
}

export default function RouteGuard({
  children,
  allowedRoles = [],
  requireOrganization = false,
  fallbackPath = "/sign-in",
}: RouteGuardProps) {
  const router = useRouter();
  const { user, hasSession, isLoading } = useExtendedSession();

  useEffect(() => {
    if (isLoading) return;

    if (!hasSession) {
      router.push(fallbackPath);
      return;
    }

    if (allowedRoles.length > 0 && (!user?.role || !allowedRoles.includes(user.role))) {
      switch (user?.role) {
        case "super-admin":
          router.push("/superadmin");
          break;
        case "admin":
          router.push("/admin");
          break;
        case "watcher":
          router.push("/watcher");
          break;
        case "independent-reporter":
          router.push("/independent-reporter");
          break;
        default:
          router.push(fallbackPath);
      }
      return;
    }

    if (requireOrganization && !user?.organizationId) {
      router.push("/no-organization");
      return;
    }
  }, [hasSession, user, isLoading, router, allowedRoles, requireOrganization, fallbackPath]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="32" />
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="32" />
      </div>
    );
  }

  if (allowedRoles.length > 0 && (!user?.role || !allowedRoles.includes(user.role))) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="32" />
      </div>
    );
  }

  if (requireOrganization && !user?.organizationId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="32" />
      </div>
    );
  }

  return <>{children}</>;
}
