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
  let body: ArrayBuffer | undefined;

  if (request.method !== "GET" && request.method !== "HEAD") {
    // Read as BYTES, never as text. `request.text()` decodes the body as
    // UTF-8, and every byte sequence that is not valid UTF-8 is replaced with
    // U+FFFD -- which destroys binary uploads irreversibly. A PNG's leading
    // 0x89 becomes EF BF BD, so the upstream sees application/octet-stream
    // instead of image/png and rejects a perfectly valid file.
    body = await request.arrayBuffer();

    if (contentType) {
      // Forwarded verbatim because it carries the multipart boundary, without
      // which the upstream cannot parse the body at all.
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

  /*
   * Read the response as BYTES, for the same reason the request body is read
   * as bytes: `upstream.text()` decodes as UTF-8 and replaces every invalid
   * sequence with U+FFFD, which destroys any binary payload. That is fine for
   * JSON and fatal for a PDF -- an invoice download would arrive corrupt and
   * unopenable.
   */
  const payload = await upstream.arrayBuffer();

  const responseHeaders = new Headers({
    "Content-Type": upstream.headers.get("content-type") ?? "application/json",
  });

  // Carries the download filename for the invoice PDF. Without it the browser
  // names the file after the route segment.
  const disposition = upstream.headers.get("content-disposition");
  if (disposition) {
    responseHeaders.set("Content-Disposition", disposition);
  }

  const cacheControl = upstream.headers.get("cache-control");
  if (cacheControl) {
    responseHeaders.set("Cache-Control", cacheControl);
  }

  const response = new NextResponse(payload.byteLength > 0 ? payload : null, {
    status: upstream.status,
    headers: responseHeaders,
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
