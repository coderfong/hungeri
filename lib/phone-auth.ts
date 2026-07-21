/** Reduce phone input to a stable synthetic-account identifier. */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 ? digits : null;
}

/** Only allow same-site redirects supplied by login query parameters. */
export function safeInternalRedirect(raw: string, fallback: string): string {
  const target = raw.trim();
  return target.startsWith("/") && !target.startsWith("//") && !target.includes("\\")
    ? target
    : fallback;
}
