import "server-only";

import { apiErrorFromEnvelope } from "@/lib/api-error";
import { getSessionToken } from "@/lib/session";

/**
 * Server-side Laravel client.
 *
 * Used by Server Components and by the BFF route handlers. Runs inside the
 * Next.js server, so it may hold the bearer token; nothing here is ever sent
 * to the browser.
 *
 * API_BASE_URL is deliberately NOT prefixed with NEXT_PUBLIC_ -- it must stay
 * server-only. With the BFF in place the browser never needs to know where
 * Laravel lives.
 */

export const API_BASE_URL = (
  process.env.API_BASE_URL ?? "http://localhost:8000/api/v1"
).replace(/\/+$/, "");

type RequestOptions = {
  method?: string;
  body?: unknown;
  /** Omit the Authorization header (login only). */
  anonymous?: boolean;
  /** Next.js caching; defaults to no-store since this is all per-user data. */
  cache?: RequestCache;
};

type SuccessEnvelope<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<SuccessEnvelope<T>> {
  const { method = "GET", body, anonymous = false, cache = "no-store" } = options;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (!anonymous) {
    const token = await getSessionToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache,
  });

  const payload = await safeJson(response);

  if (!response.ok) {
    throw apiErrorFromEnvelope(response.status, payload);
  }

  return payload as SuccessEnvelope<T>;
}

async function safeJson(response: Response): Promise<unknown> {
  const text = await response.text();

  if (text.length === 0) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: "The server returned an unreadable response." };
  }
}
