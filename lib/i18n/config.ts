/**
 * Localisation config. MVP defaults to Singapore. Currency amounts are stored as
 * integer cents everywhere; format them only at the edges via formatMoney().
 */
export const LOCALE = "en-SG";
export const CURRENCY = "SGD";
export const TIMEZONE = "Asia/Singapore";

/** Format integer cents as a localised currency string, e.g. 1500 -> "$15.00". */
export function formatMoney(cents: number, currency = CURRENCY): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
  }).format(cents / 100);
}

/** Format an ISO timestamp in the platform timezone. */
export function formatDateTime(
  iso: string | Date,
  opts: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" },
): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat(LOCALE, { timeZone: TIMEZONE, ...opts }).format(d);
}
