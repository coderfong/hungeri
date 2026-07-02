import type { DealType, DealChannel } from "@/types/database";
import { formatMoney } from "@/lib/i18n/config";

/**
 * Deal presentation helpers. Pure + server-safe. This is the single source of
 * truth for how a deal's offer, savings, and urgency are described, so the
 * colour-meaning rules (green=savings, coral=urgency, gold=paid) stay consistent
 * across feed cards, detail pages, and search.
 */

const DEAL_TYPE_LABELS: Record<DealType, string> = {
  percentage: "% OFF",
  fixed_amount: "$ OFF",
  bogo: "1-FOR-1",
  set_menu: "SET MENU",
  freebie: "FREE ITEM",
  happy_hour: "HAPPY HOUR",
  loyalty: "LOYALTY",
};

const CHANNEL_LABELS: Record<DealChannel, string> = {
  dine_in: "Dine-in",
  takeaway: "Takeaway",
  delivery: "Delivery",
};

/** Short uppercase badge shown on the card image, e.g. "30% OFF", "1-FOR-1". */
export function dealBadge(deal: {
  deal_type: DealType;
  discount_value: number | null;
}): string {
  switch (deal.deal_type) {
    case "percentage":
      return deal.discount_value ? `${deal.discount_value}% OFF` : "% OFF";
    case "fixed_amount":
      return deal.discount_value
        ? `${formatMoney(deal.discount_value * 100)} OFF`
        : "$ OFF";
    default:
      return DEAL_TYPE_LABELS[deal.deal_type];
  }
}

/**
 * Savings label for the green badge, when we can state a concrete amount.
 * We only have discount_value (not a base price), so a firm "$X off" is only
 * truthful for fixed_amount deals; for % deals we show the percent instead and
 * return null here to avoid implying an exact dollar saving.
 */
export function savingsLabel(deal: {
  deal_type: DealType;
  discount_value: number | null;
}): string | null {
  if (deal.deal_type === "fixed_amount" && deal.discount_value) {
    return `Save ${formatMoney(deal.discount_value * 100)}`;
  }
  if (deal.deal_type === "percentage" && deal.discount_value) {
    return `${deal.discount_value}% off`;
  }
  if (deal.deal_type === "bogo") return "Buy 1 get 1";
  if (deal.deal_type === "freebie") return "Free item";
  return null;
}

export function channelLabel(c: DealChannel): string {
  return CHANNEL_LABELS[c];
}

const MS = { hour: 3_600_000, day: 86_400_000 };

/** A deal is "ending soon" if it closes within the next 24h. */
export function isEndingSoon(endAt: string, withinMs = MS.day): boolean {
  const ms = new Date(endAt).getTime() - Date.now();
  return ms > 0 && ms <= withinMs;
}

/** A deal is "new today" if created within the last 24h. */
export function isNewToday(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() <= MS.day;
}

export function isExpired(endAt: string): boolean {
  return new Date(endAt).getTime() <= Date.now();
}

/** Whether to show a live HH:MM:SS countdown (only when <24h remain). */
export function shouldCountdown(endAt: string): boolean {
  return isEndingSoon(endAt);
}

/**
 * The deal-expiry rule, mirrored in JS so it can be unit-tested. The scheduled
 * SQL job (public.expire_deals) flips exactly these rows: a deal currently 'live'
 * whose end_at has passed must become 'expired'. Integrity is also guarded at
 * write time by the enforce_live_deal_window trigger.
 */
export function shouldExpire(
  deal: { status: string; end_at: string },
  now: number = Date.now(),
): boolean {
  return deal.status === "live" && new Date(deal.end_at).getTime() <= now;
}
