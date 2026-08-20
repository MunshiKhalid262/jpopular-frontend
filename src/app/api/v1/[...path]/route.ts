import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { API_BASE_URL } from "@/lib/server-api";
import { SESSION_COOKIE, getSessionToken } from "@/lib/session";

/**
 * Authenticated proxy: /api/v1/*  ->  Laravel /api/v1/*
 *
 * The browser talks only to its own origin, so no CORS policy is needed and the
 * bearer token never leaves the server. Attached here from the httpOnly cookie.
 *
 * Auth endpoints are deliberately NOT proxied through this handler -- login and
 * logout have their own handlers because they manage the cookie. `/auth/*` is
 * blocked below so a client cannot reach Laravel's login through the proxy and
 * receive a raw token in the response body.
 */

const BLOCKED_PREFIXES = ["auth/login", "auth/logout"];

async function proxy(request: Request, path: string[]): Promise<Response> {
  const subPath = path.join("/");

  if (BLOCKED_PREFIXES.some((blocked) => subPath === blocked)) {
    return NextResponse.json(
      { success: false, message: "Use the dedicated auth endpoint." },
      { status: 404 },
    );
  }

  const token = await getSessionToken();

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Unauthenticated.", code: "UNAUTHENTICATED" },
      { status: 401 },
    );
  }

  const incomingUrl = new URL(request.url);
  const target = `${API_BASE_URL}/${subPath}${incomingUrl.search}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };

  const contentType = request.headers.get("content-type");
  let body: string | undefined;

  if (request.method !== "GET" && request.method !== "HEAD") {
    body = await request.text();

    if (contentType) {
      headers["Content-Type"] = contentType;
    }
  }

  let upstream: Response;

  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Unable to reach the API. Please try again." },
      { status: 502 },
    );
  }

  const text = await upstream.text();

  const response = new NextResponse(text.length > 0 ? text : null, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/json",
    },
  });

  // A revoked or expired token must not linger in the browser.
  if (upstream.status === 401) {
    const store = await cookies();
    store.delete(SESSION_COOKIE);
  }

  return response;
}

type Context = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, context: Context) {
  const { path } = await context.params;

  return proxy(request, path);
}

export async function POST(request: Request, context: Context) {
  const { path } = await context.params;

  return proxy(request, path);
}

export async function PUT(request: Request, context: Context) {
  const { path } = await context.params;

  return proxy(request, path);
}

export async function PATCH(request: Request, context: Context) {
  const { path } = await context.params;

  return proxy(request, path);
}

export async function DELETE(request: Request, context: Context) {
  const { path } = await context.params;

  return proxy(request, path);
}
