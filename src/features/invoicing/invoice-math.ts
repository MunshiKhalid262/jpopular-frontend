/**
 * Decimal-safe arithmetic for the invoice form's running subtotal.
 *
 * DISPLAY ONLY. The server recomputes every figure through the tax engine and
 * is authoritative; nothing here touches GST apportionment or per-line
 * rounding, because a second implementation of those rules would eventually
 * disagree with the first by a paisa.
 *
 * Uses BigInt rather than Number, matching the rule in src/lib/money.ts that a
 * decimal string never passes through JavaScript floating point.
 */

/** The project targets ES2017, where BigInt literals are a syntax error. */
const ZERO = BigInt(0);
const TEN = BigInt(10);

const DECIMAL = /^\d+(\.\d+)?$/;

/** Scales a decimal string to an integer BigInt at `scale` places. */
function toScaled(value: string, scale: number): bigint | null {
  const trimmed = value.trim();

  if (!DECIMAL.test(trimmed)) {
    return null;
  }

  const [integer, fraction = ""] = trimmed.split(".");

  return BigInt(integer + fraction.slice(0, scale).padEnd(scale, "0"));
}

function fromScaled(value: bigint, scale: number): string {
  const digits = value.toString().padStart(scale + 1, "0");

  return `${digits.slice(0, -scale)}.${digits.slice(-scale)}`;
}

function pow10(exponent: number): bigint {
  let result = BigInt(1);

  for (let i = 0; i < exponent; i++) {
    result *= TEN;
  }

  return result;
}

/**
 * quantity (3 dp) x unit price (2 dp), rounded half-up to 2 dp.
 *
 * Returns null when either input is not a valid decimal, so the caller shows a
 * dash rather than a misleading figure.
 */
export function lineAmount(quantity: string, unitPrice: string): string | null {
  const qty = toScaled(quantity, 3);
  const price = toScaled(unitPrice, 2);

  if (qty === null || price === null || qty <= ZERO) {
    return null;
  }

  // Product carries 5 decimal places; bring it back to 2, half-up.
  const product = qty * price;
  const divisor = pow10(3);
  const rounded = (product + divisor / BigInt(2)) / divisor;

  return fromScaled(rounded, 2);
}

/** Adds 2 dp amounts exactly. */
export function sumAmounts(amounts: string[]): string {
  let total = ZERO;

  for (const amount of amounts) {
    total += toScaled(amount, 2) ?? ZERO;
  }

  return fromScaled(total, 2);
}
