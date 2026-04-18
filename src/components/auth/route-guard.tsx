"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
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
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const { user, isLoading: userLoading } = useExtendedSession();

  useEffect(() => {
    if (sessionPending || userLoading) return; // Still loading

    // No session, redirect to sign in
    if (!session) {
      router.push(fallbackPath);
      return;
    }

    // Check role requirements
    if (
      allowedRoles.length > 0 &&
      (!user?.role || !allowedRoles.includes(user.role))
    ) {
      // Redirect based on user's actual role
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

    // Check organization requirement
    if (requireOrganization && !user?.organizationId) {
      router.push("/no-organization");
      return;
    }
  }, [
    session,
    sessionPending,
    user,
    userLoading,
    router,
    allowedRoles,
    requireOrganization,
    fallbackPath,
  ]);

  // Show loading while checking auth
  if (sessionPending || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="32" />
      </div>
    );
  }

  // Show loading if no session (while redirecting)
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="32" />
      </div>
    );
  }

  // Check role authorization
  if (
    allowedRoles.length > 0 &&
    (!user?.role || !allowedRoles.includes(user.role))
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="32" />
      </div>
    );
  }

  // Check organization requirement
  if (requireOrganization && !user?.organizationId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="32" />
      </div>
    );
  }

  return <>{children}</>;
}
