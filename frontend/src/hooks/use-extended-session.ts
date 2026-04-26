"use client";

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

export function useExtendedSession() {
  const {
    data: extendedUser,
    isLoading: userLoading,
    error,
  } = trpc.getCurrentUser.useQuery(undefined, {
    retry: false,
  });

  const user = extendedUser as ExtendedUser | undefined;
  const hasSession = !!(user?.id && user.id !== "");

  return {
    user,
    hasSession,
    isLoading: userLoading,
    error,
  };
}
