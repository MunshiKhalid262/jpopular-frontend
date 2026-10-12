/**
 * Dates in the business's own timezone.
 *
 * The books are kept in Asia/Kolkata and the backend reports in it too, so a
 * date the operator sees has to be the date the shop is having, not the one
 * the browser's clock or UTC happens to be on.
 *
 * `new Date().toISOString()` is UTC. In IST (UTC+5:30) that is yesterday until
 * half past five in the morning, so an invoice opened early would have
 * defaulted to the wrong day and been filed into the wrong day's takings.
 */
const BUSINESS_TIMEZONE = "Asia/Kolkata";

/**
 * Today in the business timezone, as `YYYY-MM-DD`.
 *
 * en-CA is used because it formats as ISO, which is what an `<input
 * type="date">` expects; the locale is a formatting trick, not a language
 * choice.
 */
export function businessToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
