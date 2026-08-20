import "server-only";

import { cookies } from "next/headers";

/**
 * Session cookie handling. Server-only by construction: the "server-only"
 * import above makes importing this from a Client Component a build error, so
 * the token can never be bundled into browser JavaScript.
 *
 * See ARCHITECTURE-V1.md section 3.4 (Sanctum token behind a Next BFF).
 */

export const SESSION_COOKIE = "jpopular_session";

/** Mirrors Sanctum's 12-hour token lifetime (SANCTUM_TOKEN_EXPIRATION=720). */
const MAX_AGE_SECONDS = 720 * 60;

export type SessionCookieOptions = {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge?: number;
};

/**
 * `secure` is driven by NODE_ENV so local HTTP development works while
 * production automatically requires HTTPS. It is never hard-coded to false.
 */
export function sessionCookieOptions(): SessionCookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();

  return store.get(SESSION_COOKIE)?.value ?? null;
}
