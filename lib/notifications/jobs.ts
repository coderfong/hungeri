import { createAdminClient } from "@/lib/supabase/admin";
import { getNotifier } from "@/lib/notifications/resend";
import { expiringSavedEmail, newNearbyEmail } from "@/lib/notifications/templates";

/**
 * Scheduled work, run by /api/cron (Vercel Cron or pg_cron via pg_net):
 *   1. expire_deals()        — flip past-window live deals to expired.
 *   2. expiring-saved emails — saved deals ending within 24h.
 *   3. new-nearby emails     — deals created in the last 24h near a user's home.
 *
 * Uses the service-role client (cross-user reads RLS forbids). Notifications
 * respect each consumer's notification_prefs and no-op cleanly without Resend.
 */
const DAY = 86_400_000;

type DealLite = { id: string; title: string; end_at: string; business: string };

export async function runScheduledJobs() {
  const admin = createAdminClient();
  const notifier = getNotifier();
  const now = Date.now();

  // 1) Expire stale deals + end stale placements.
  const { data: expired } = await admin.rpc("expire_deals");

  // Shared lookups: prefs + emails.
  const { data: profiles } = await admin
    .from("consumer_profiles")
    .select("user_id, home_lat, home_lng, notification_prefs");
  const prefsByUser = new Map(
    (profiles ?? []).map((p) => [p.user_id, (p.notification_prefs ?? {}) as Record<string, boolean>]),
  );

  // ── 2) Expiring saved deals ────────────────────────────────────────────────
  const soon = new Date(now + DAY).toISOString();
  const { data: saves } = await admin
    .from("saves")
    .select("consumer_id, deals!inner(id, title, end_at, status, businesses(name))")
    .eq("deals.status", "live")
    .lte("deals.end_at", soon)
    .gte("deals.end_at", new Date(now).toISOString());

  const byConsumer = new Map<string, DealLite[]>();
  for (const row of (saves ?? []) as unknown as {
    consumer_id: string;
    deals: { id: string; title: string; end_at: string; businesses: { name: string } | null };
  }[]) {
    const d = row.deals;
    if (!d) continue;
    const list = byConsumer.get(row.consumer_id) ?? [];
    list.push({ id: d.id, title: d.title, end_at: d.end_at, business: d.businesses?.name ?? "" });
    byConsumer.set(row.consumer_id, list);
  }

  const emails = await emailsFor(admin, [...byConsumer.keys()]);
  let expiringSent = 0;
  for (const [userId, deals] of byConsumer) {
    if (prefsByUser.get(userId)?.expiring_saved === false) continue;
    const to = emails.get(userId);
    if (!to) continue;
    if (await notifier.send({ to, ...expiringSavedEmail(deals) })) expiringSent++;
  }

  // ── 3) New deals near home ──────────────────────────────────────────────────
  let nearbySent = 0;
  const withHome = (profiles ?? []).filter((p) => p.home_lat != null && p.home_lng != null);
  const homeEmails = await emailsFor(admin, withHome.map((p) => p.user_id));
  for (const p of withHome) {
    if ((prefsByUser.get(p.user_id) ?? {}).new_nearby === false) continue;
    const to = homeEmails.get(p.user_id);
    if (!to) continue;

    const { data: near } = await admin.rpc("deals_near", {
      in_lat: p.home_lat!,
      in_lng: p.home_lng!,
      in_radius_m: 5000,
    });
    const ids = (near ?? []).map((r: { deal_id: string }) => r.deal_id);
    if (ids.length === 0) continue;

    const { data: fresh } = await admin
      .from("deals")
      .select("id, title, end_at, businesses(name)")
      .in("id", ids)
      .eq("status", "live")
      .gte("created_at", new Date(now - DAY).toISOString());
    const deals: DealLite[] = (fresh ?? []).map((d) => ({
      id: d.id as string,
      title: d.title as string,
      end_at: d.end_at as string,
      business:
        (Array.isArray(d.businesses) ? d.businesses[0]?.name : (d.businesses as { name?: string })?.name) ?? "",
    }));
    if (deals.length === 0) continue;
    if (await notifier.send({ to, ...newNearbyEmail("you", deals) })) nearbySent++;
  }

  return { expired: expired ?? 0, expiringSent, nearbySent };
}

async function emailsFor(
  admin: ReturnType<typeof createAdminClient>,
  userIds: string[],
): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map();
  const { data } = await admin.from("users").select("id, email").in("id", userIds);
  return new Map((data ?? []).map((u) => [u.id, u.email]));
}
