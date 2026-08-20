import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { apiFetch } from "@/lib/server-api";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * POST /api/auth/logout  (BFF)
 *
 * Revokes the token server-side, then clears the cookie. The cookie is cleared
 * even if the API call fails -- a local session must never survive a logout the
 * user asked for.
 */
export async function POST() {
  try {
    await apiFetch("/auth/logout", { method: "POST" });
  } catch {
    // Token already expired or revoked; clearing the cookie is still correct.
  }

  const store = await cookies();
  store.delete(SESSION_COOKIE);

  return NextResponse.json({ success: true, data: null });
}
