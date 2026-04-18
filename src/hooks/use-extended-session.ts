"use client";

import { authClient } from "@/lib/auth-client";
import { trpc } from "@/_trpc/client";
import { UserRole } from "./use-role-check";

export interface ExtendedUser {
  id: string;
  name: string;
  email: string;
  role?: UserRole;
  organizationId?: string;
  banned?: boolean;
  banReason?: string;
  banExpires?: Date;
}

/**
 * Hook to get extended user session with organization data
 */
export function useExtendedSession() {
  const { data: session, isPending: sessionPending } = authClient.useSession();

  // Fetch extended user data if session exists
  const {
    data: extendedUser,
    isLoading: userLoading,
    error,
  } = trpc.getCurrentUser.useQuery(undefined, {
    enabled: !!session?.user?.id,
    retry: false,
  });

  return {
    session,
    user: extendedUser as ExtendedUser | undefined,
    isLoading: sessionPending || userLoading,
    error,
  };
}
