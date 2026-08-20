import "server-only";

import { cache } from "react";

import type { AuthUser } from "@/features/auth/types";
import { ApiError } from "@/lib/api-error";
import { apiFetch } from "@/lib/server-api";
import { getSessionToken } from "@/lib/session";

/**
 * Resolves the signed-in user from /auth/me.
 *
 * Wrapped in React's `cache` so a single render that needs the user in both a
 * layout and a page performs one request, not two.
 *
 * Returns null for any authentication failure -- including a cookie that looks
 * present but holds a revoked or expired token. This is the real authentication
 * check; middleware only inspects cookie presence.
 */
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const token = await getSessionToken();

  if (!token) {
    return null;
  }

  try {
    const { data } = await apiFetch<AuthUser>("/auth/me");

    return data;
  } catch (error) {
    if (error instanceof ApiError && (error.isUnauthenticated || error.isForbidden)) {
      return null;
    }

    throw error;
  }
});
