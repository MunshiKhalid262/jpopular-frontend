"use client";

/**
 * Browser-side catalog mutations.
 *
 * Everything goes through this app's own /api/v1 proxy, which attaches the
 * bearer token server-side from the httpOnly cookie. The browser never talks to
 * Laravel directly and never handles a token.
 */

export type MutationFailure = {
  message: string;
  errors: Record<string, string[]>;
  code: string | null;
  status: number;
  /** Ties a server error to its log line; present on 500s. */
  reference: string | null;
  /** The real exception, when the API is configured to expose it. */
  debug: { exception: string; message: string; file: string; line: number } | null;
};

export type MutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; failure: MutationFailure };

async function parse(response: Response): Promise<unknown> {
  const text = await response.text();

  if (text.length === 0) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function request<T>(
  path: string,
  init: { method: string; json?: unknown; form?: FormData },
): Promise<MutationResult<T>> {
  let response: Response;

  try {
    response = await fetch(`/api/v1${path}`, {
      method: init.method,
      // FormData sets its own multipart boundary; never set Content-Type here.
      headers: init.json === undefined ? undefined : { "Content-Type": "application/json" },
      body: init.form ?? (init.json === undefined ? undefined : JSON.stringify(init.json)),
    });
  } catch {
    return {
      ok: false,
      failure: {
        message: "Could not reach the server. Check your connection and try again.",
        errors: {},
        code: null,
        status: 0,
        reference: null,
        debug: null,
      },
    };
  }

  const payload = (await parse(response)) as
    | {
        success?: boolean;
        data?: T;
        message?: string;
        errors?: Record<string, string[]>;
        code?: string;
        reference?: string;
        debug?: MutationFailure["debug"];
      }
    | null;

  if (!response.ok) {
    /*
     * Prefer the real exception when the API exposes it. A 500 otherwise says
     * only "An unexpected error occurred", which tells the operator nothing
     * and tells whoever they report it to even less.
     *
     * The reference is appended either way, because it is what finds the
     * stack trace in the log.
     */
    const base =
      payload?.debug?.message ??
      payload?.message ??
      (response.status === 0
        ? "Could not reach the server."
        : `The request failed (HTTP ${response.status}).`);

    const message = payload?.reference ? `${base} (ref: ${payload.reference})` : base;

    return {
      ok: false,
      failure: {
        message,
        errors: payload?.errors ?? {},
        code: payload?.code ?? null,
        status: response.status,
        reference: payload?.reference ?? null,
        debug: payload?.debug ?? null,
      },
    };
  }

  return { ok: true, data: (payload?.data ?? null) as T };
}

export function postJson<T>(path: string, json: unknown): Promise<MutationResult<T>> {
  return request<T>(path, { method: "POST", json });
}

export function putJson<T>(path: string, json: unknown): Promise<MutationResult<T>> {
  return request<T>(path, { method: "PUT", json });
}

export function del<T>(path: string): Promise<MutationResult<T>> {
  return request<T>(path, { method: "DELETE" });
}

/**
 * Multipart submit. Laravel does not read multipart bodies on PUT, so an
 * update is POSTed with a `_method=PUT` override -- the framework's documented
 * form-method spoofing.
 */
export function submitForm<T>(
  path: string,
  form: FormData,
  method: "POST" | "PUT",
): Promise<MutationResult<T>> {
  if (method === "PUT") {
    form.set("_method", "PUT");
  }

  return request<T>(path, { method: "POST", form });
}
