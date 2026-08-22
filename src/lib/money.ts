/**
 * Currency and quantity formatting for Indian business use.
 *
 * The API sends money as DECIMAL strings ("84999.00"). These helpers format
 * those strings by STRING manipulation and never call Number() on them, so no
 * value ever passes through JavaScript floating point. Display-only: any
 * business-sensitive arithmetic happens server-side with bcmath.
 *
 * See ARCHITECTURE-V1.md sections 2.5 and 21.
 */

const RUPEE = "₹";

type ParsedDecimal = {
  negative: boolean;
  integer: string;
  fraction: string;
};

function parseDecimal(value: string): ParsedDecimal | null {
  const trimmed = value.trim();

  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return null;
  }

  const negative = trimmed.startsWith("-");
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const [integer, fraction = ""] = unsigned.split(".");

  return { negative, integer, fraction };
}

/**
 * Indian digit grouping: the last three digits, then groups of two.
 * 125000 -> 1,25,000
 */
function groupIndian(integer: string): string {
  if (integer.length <= 3) {
    return integer;
  }

  const lastThree = integer.slice(-3);
  const rest = integer.slice(0, -3);
  const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");

  return `${grouped},${lastThree}`;
}

function padFraction(fraction: string, digits: number): string {
  return fraction.slice(0, digits).padEnd(digits, "0");
}

/**
 * "125000.00" -> "₹1,25,000.00"
 *
 * Returns a dash for null/undefined so tables stay aligned.
 */
export function formatInr(value: string | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const parsed = parseDecimal(value);

  if (parsed === null) {
    return value; // show it verbatim rather than inventing a number
  }

  const sign = parsed.negative ? "-" : "";

  return `${sign}${RUPEE}${groupIndian(parsed.integer)}.${padFraction(parsed.fraction, 2)}`;
}

/**
 * Quantity without a currency symbol, trailing zeros trimmed.
 * "25.000" -> "25"   "1.500" -> "1.5"
 */
export function formatQuantity(value: string | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const parsed = parseDecimal(value);

  if (parsed === null) {
    return value;
  }

  const fraction = parsed.fraction.replace(/0+$/, "");
  const sign = parsed.negative ? "-" : "";
  const integer = groupIndian(parsed.integer);

  return fraction === "" ? `${sign}${integer}` : `${sign}${integer}.${fraction}`;
}

/**
 * "18.00" -> "18%"   "2.50" -> "2.5%"
 */
export function formatPercent(value: string | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const parsed = parseDecimal(value);

  if (parsed === null) {
    return value;
  }

  const fraction = parsed.fraction.replace(/0+$/, "");

  return fraction === ""
    ? `${parsed.integer}%`
    : `${parsed.integer}.${fraction}%`;
}
