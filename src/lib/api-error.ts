/**
 * The single error type for every failed API call, mirroring the Laravel
 * response envelope in ARCHITECTURE-V1.md section 9.1.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly errors: Record<string, string[]>;
  readonly code: string | null;

  constructor(
    status: number,
    message: string,
    errors: Record<string, string[]> = {},
    code: string | null = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.code = code;
  }

  /** Validation failure: field-level messages are available. */
  get isValidation(): boolean {
    return this.status === 422;
  }

  get isUnauthenticated(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  /** A business-rule conflict, e.g. LAST_ACTIVE_ADMIN. */
  get isConflict(): boolean {
    return this.status === 409;
  }

  /** First message for a field, for inline form errors. */
  fieldError(field: string): string | undefined {
    return this.errors[field]?.[0];
  }
}

type ErrorEnvelope = {
  message?: unknown;
  errors?: unknown;
  code?: unknown;
};

/** Builds an ApiError from a non-2xx response body, tolerating malformed JSON. */
export function apiErrorFromEnvelope(status: number, body: unknown): ApiError {
  const envelope: ErrorEnvelope =
    typeof body === "object" && body !== null ? (body as ErrorEnvelope) : {};

  const message =
    typeof envelope.message === "string" && envelope.message.length > 0
      ? envelope.message
      : defaultMessageFor(status);

  const errors: Record<string, string[]> = {};

  if (typeof envelope.errors === "object" && envelope.errors !== null) {
    for (const [field, value] of Object.entries(envelope.errors)) {
      if (Array.isArray(value)) {
        errors[field] = value.filter((v): v is string => typeof v === "string");
      } else if (typeof value === "string") {
        errors[field] = [value];
      }
    }
  }

  const code = typeof envelope.code === "string" ? envelope.code : null;

  return new ApiError(status, message, errors, code);
}

function defaultMessageFor(status: number): string {
  switch (status) {
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return "That record could not be found.";
    case 422:
      return "Please correct the highlighted fields.";
    case 429:
      return "Too many requests. Please wait a moment and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}
