import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { loginSchema } from "@/features/auth/schemas";
import type { AuthUser } from "@/features/auth/types";
import { ApiError } from "@/lib/api-error";
import { apiFetch } from "@/lib/server-api";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

/**
 * POST /api/auth/login  (BFF)
 *
 * Exchanges credentials for a Sanctum token, stores the token in an httpOnly
 * cookie, and returns ONLY the user object. The token itself never reaches the
 * browser response body, so browser JavaScript cannot read it.
 */
export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Malformed request body." },
      { status: 400 },
    );
  }

  const parsed = loginSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Please correct the highlighted fields.",
        errors: fieldErrors(parsed.error.issues),
        code: "VALIDATION_FAILED",
      },
      { status: 422 },
    );
  }

  try {
    const { data } = await apiFetch<{ token: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      anonymous: true,
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
        device_name: "jpopular-web",
      },
    });

    const store = await cookies();
    store.set(SESSION_COOKIE, data.token, sessionCookieOptions());

    // Note: `user` only. The token stays in the cookie.
    return NextResponse.json({ success: true, data: { user: data.user } });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
          errors: error.errors,
          code: error.code,
        },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { success: false, message: "Unable to reach the API. Please try again." },
      { status: 502 },
    );
  }
}

function fieldErrors(
  issues: readonly { path: readonly (string | number | symbol)[]; message: string }[],
): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  for (const issue of issues) {
    const key = issue.path.map(String).join(".") || "form";
    result[key] = [...(result[key] ?? []), issue.message];
  }

  return result;
}
