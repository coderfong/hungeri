import { clientEnv } from "@/lib/env";
import { formatDateTime } from "@/lib/i18n/config";

/** Branded transactional email templates (inline-styled for email clients). */

const SITE = clientEnv.NEXT_PUBLIC_SITE_URL;

function shell(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#FFF9F5;font-family:Arial,Helvetica,sans-serif;color:#1C1410;">
  <div style="max-width:520px;margin:0 auto;padding:28px 22px;">
    <div style="font-weight:800;font-size:22px;color:#FF5A1F;margin-bottom:18px;">Hungeri</div>
    <h1 style="font-size:20px;margin:0 0 14px;">${title}</h1>
    ${body}
    <hr style="border:none;border-top:1px solid #ECE4DD;margin:24px 0;">
    <p style="font-size:12px;color:#918579;line-height:1.5;">You're getting this because you saved deals or enabled nearby alerts on Hungeri. Manage preferences in your <a href="${SITE}/account" style="color:#FF5A1F;">account</a>.</p>
  </div></body></html>`;
}

function dealRow(d: { id: string; title: string; business: string; end_at: string }): string {
  return `<a href="${SITE}/deals/${d.id}" style="display:block;text-decoration:none;color:#1C1410;border:1px solid #F3ECE5;border-radius:12px;padding:12px 14px;margin-bottom:10px;">
    <div style="font-weight:700;font-size:15px;">${d.title}</div>
    <div style="font-size:13px;color:#6B5F56;">${d.business} · ends ${formatDateTime(d.end_at, { dateStyle: "medium", timeStyle: "short" })}</div>
  </a>`;
}

export function expiringSavedEmail(deals: { id: string; title: string; business: string; end_at: string }[]) {
  return {
    subject:
      deals.length === 1
        ? `⏳ "${deals[0].title}" is ending soon`
        : `⏳ ${deals.length} saved deals are ending soon`,
    html: shell(
      "Your saved deals are about to expire",
      `<p style="font-size:14px;color:#6B5F56;margin:0 0 16px;">Catch them before they're gone:</p>${deals.map(dealRow).join("")}`,
    ),
  };
}

export function newNearbyEmail(
  area: string,
  deals: { id: string; title: string; business: string; end_at: string }[],
) {
  return {
    subject: `🍜 ${deals.length} new deal${deals.length === 1 ? "" : "s"} near ${area}`,
    html: shell(
      `Fresh deals near ${area}`,
      `<p style="font-size:14px;color:#6B5F56;margin:0 0 16px;">New since yesterday:</p>${deals.map(dealRow).join("")}`,
    ),
  };
}
