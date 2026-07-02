import QRCode from "qrcode";
import { requireBusiness } from "@/lib/merchant/context";
import { clientEnv } from "@/lib/env";
import { PrintButton } from "@/components/merchant/print-button";

export const metadata = { title: "Your QR code" };

/**
 * The shop's unique, static redemption QR. Print it and display it at the
 * counter — customers scan it in-app to redeem deals (proving they're on-site).
 * The QR encodes {SITE_URL}/r/{qr_token}; scanning with a phone camera opens the
 * shop's Hungeri page, and the in-app scanner reads the same token to redeem.
 */
export default async function QrPage() {
  const { business } = await requireBusiness();
  const redeemUrl = `${clientEnv.NEXT_PUBLIC_SITE_URL}/r/${business.qr_token}`;
  const svg = await QRCode.toString(redeemUrl, {
    type: "svg",
    margin: 1,
    width: 320,
    color: { dark: "#1C1410", light: "#ffffff" },
  });

  return (
    <div className="mx-auto max-w-xl px-5 py-6 md:px-8">
      <h1 className="mb-1 font-display text-2xl font-extrabold">Your redemption QR</h1>
      <p className="mb-6 text-sm text-ink-500">
        Print this and place it at your counter. Customers scan it to redeem deals — it’s
        unique to {business.name} and never changes.
      </p>

      <div className="mx-auto max-w-sm rounded-card-lg border border-line-soft bg-surface p-7 text-center shadow-card">
        <div className="mb-4 font-display text-lg font-extrabold">{business.name}</div>
        <div
          className="mx-auto w-full max-w-[280px] [&>svg]:h-auto [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <p className="mt-4 text-xs font-semibold text-muted">Scan with the Hungeri app to redeem</p>
        <p className="mt-1 break-all font-mono text-[10px] text-ink-300">{redeemUrl}</p>
      </div>

      <div className="mt-6 flex justify-center print:hidden">
        <PrintButton />
      </div>
    </div>
  );
}
