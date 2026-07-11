import QRCode from "qrcode";
import { requireBusiness } from "@/lib/merchant/context";
import { clientEnv } from "@/lib/env";
import { PrintButton } from "@/components/merchant/print-button";
import { LogoMark } from "@/components/logo";

export const metadata = { title: "Your QR code" };

/**
 * The shop's unique, static redemption QR. Print it and display it at the
 * counter — customers scan it in-app to redeem deals (proving they're on-site).
 * The QR encodes {SITE_URL}/r/{qr_token}; scanning with a phone camera opens the
 * shop's Hungeri page, and the in-app scanner reads the same token to redeem.
 * Error correction is "H" so the Hungeri mark can sit over the centre without
 * breaking scans.
 */
export default async function QrPage() {
  const { business } = await requireBusiness();
  const redeemUrl = `${clientEnv.NEXT_PUBLIC_SITE_URL}/r/${business.qr_token}`;
  const svg = await QRCode.toString(redeemUrl, {
    type: "svg",
    margin: 1,
    width: 320,
    errorCorrectionLevel: "H",
    color: { dark: "#1C1410", light: "#ffffff" },
  });

  return (
    <div className="mx-auto max-w-xl px-5 py-6 md:px-8">
      <h1 className="mb-1 font-display text-2xl font-extrabold">Your redemption QR</h1>
      <p className="mb-6 text-sm text-ink-500">
        Print this and place it at your counter. Customers scan it to redeem deals — it’s
        unique to {business.name} and never changes.
      </p>

      {/* Branded counter card — designed to be printed as-is. */}
      <div className="mx-auto max-w-sm overflow-hidden rounded-card-lg border border-line-soft bg-surface text-center shadow-card">
        {/* Brand band */}
        <div className="flex items-center justify-center gap-2.5 bg-gradient-to-r from-persimmon-600 to-persimmon-400 px-6 py-4 text-white">
          <LogoMark className="size-9 rounded-[11px]" />
          <span className="font-display text-xl font-extrabold tracking-tight">Hungeri</span>
        </div>

        <div className="px-7 pb-2 pt-6">
          <div className="font-display text-lg font-extrabold leading-tight">{business.name}</div>
          <p className="mt-0.5 text-xs font-semibold text-muted">Scan to redeem your deal</p>
        </div>

        {/* QR with the Hungeri mark over the centre */}
        <div className="relative mx-auto w-full max-w-[280px] px-2 [&>svg]:h-auto [&>svg]:w-full">
          <div dangerouslySetInnerHTML={{ __html: svg }} />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[14px] border-4 border-white bg-white shadow-e1">
            <LogoMark className="block size-11 rounded-[10px]" />
          </span>
        </div>

        <div className="mx-7 mt-5 border-t-2 border-dashed border-line pb-6 pt-4">
          <p className="text-xs font-bold text-ink-700">
            Point your phone camera or the Hungeri app at the code
          </p>
          <p className="mt-1.5 break-all font-mono text-[10px] text-ink-300">{redeemUrl}</p>
        </div>
      </div>

      <div className="mt-6 flex justify-center print:hidden">
        <PrintButton />
      </div>
    </div>
  );
}
