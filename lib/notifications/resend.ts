import { getServerEnv } from "@/lib/env";
import type { EmailMessage, Notifier } from "@/lib/notifications/notifier";

/**
 * Resend adapter via the REST API (no SDK dependency). If RESEND_API_KEY is
 * unset it no-ops and logs — so the app and cron jobs run fine without email
 * configured; set the key to switch sending on.
 */
class ResendNotifier implements Notifier {
  async send(msg: EmailMessage): Promise<boolean> {
    const env = getServerEnv();
    if (!env.RESEND_API_KEY) {
      console.log(`[notify:noop] would email ${msg.to} — "${msg.subject}" (set RESEND_API_KEY to send)`);
      return false;
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM ?? "Hungeri <deals@hungeri.sg>",
        to: msg.to,
        subject: msg.subject,
        html: msg.html,
      }),
    });
    if (!res.ok) {
      console.error(`[notify] Resend failed (${res.status}): ${await res.text()}`);
      return false;
    }
    return true;
  }
}

let _notifier: Notifier | null = null;
export function getNotifier(): Notifier {
  if (!_notifier) _notifier = new ResendNotifier();
  return _notifier;
}
