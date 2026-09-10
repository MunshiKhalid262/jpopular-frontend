/**
 * Decimal-safe arithmetic for the stock preview.
 *
 * Display only -- the backend is authoritative and recomputes everything under
 * a row lock. Even so this uses BigInt at the column's scale of 3 rather than
 * Number(), matching the rule in src/lib/money.ts: a decimal string never
 * passes through JavaScript floating point, so a preview can never disagree
 * with the server by a rounding artefact.
 */

const SCALE = 3;

/**
 * The project targets ES2017, where BigInt LITERALS (`0n`) are a syntax error
 * even though the type is available. The constructor is used instead.
 */
const ZERO = BigInt(0);

/** "10.5" -> 10500n, at scale 3. Null when the input is not a decimal. */
function toScaled(value: string): bigint | null {
  const trimmed = value.trim();

  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return null;
  }

  const negative = trimmed.startsWith("-");
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const [integer, fraction = ""] = unsigned.split(".");

  // Excess scale is truncated, never rounded: the backend rejects it anyway.
  const padded = fraction.slice(0, SCALE).padEnd(SCALE, "0");
  const scaled = BigInt(integer + padded);

  return negative ? -scaled : scaled;
}

/** 10500n -> "10.500" */
function fromScaled(value: bigint): string {
  const negative = value < ZERO;
  const digits = (negative ? -value : value).toString().padStart(SCALE + 1, "0");

  const integer = digits.slice(0, -SCALE);
  const fraction = digits.slice(-SCALE);

  return `${negative ? "-" : ""}${integer}.${fraction}`;
}

/**
 * Resulting stock after applying a movement, as a DECIMAL string.
 *
 * Returns null when either input is not a valid decimal, so the caller shows
 * nothing rather than a misleading figure.
 */
export function previewStock(
  currentStock: string,
  quantity: string,
  decreases: boolean,
): string | null {
  const current = toScaled(currentStock);
  const magnitude = toScaled(quantity);

  if (current === null || magnitude === null || magnitude <= ZERO) {
    return null;
  }

  return fromScaled(decreases ? current - magnitude : current + magnitude);
}

/** True when the preview would drive stock below zero. */
export function wouldGoNegative(preview: string | null): boolean {
  if (preview === null) {
    return false;
  }

  const scaled = toScaled(preview);

  return scaled !== null && scaled < ZERO;
}
