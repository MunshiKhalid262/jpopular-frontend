"use client";

import { createContext, useContext, useMemo } from "react";

import {
  hasAnyPermission,
  hasPermission,
  type Permission,
} from "@/features/auth/permissions";
import type { AuthUser } from "@/features/auth/types";

/**
 * Makes the current user available to Client Components.
 *
 * The user is fetched once, server-side, in the authenticated layout and passed
 * down -- so there is no client-side loading state for identity and no extra
 * round trip.
 */

type AuthContextValue = {
  user: AuthUser;
  can: (permission: Permission) => boolean;
  canAny: (permissions: readonly Permission[]) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      can: (permission) => hasPermission(user.permissions, permission),
      canAny: (permissions) => hasAnyPermission(user.permissions, permissions),
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }

  return context;
}

/**
 * Convenience hook for a single permission.
 *
 * Usage: const canManageUsers = usePermission(PERMISSIONS.usersManage);
 */
export function usePermission(permission: Permission): boolean {
  return useAuth().can(permission);
}
