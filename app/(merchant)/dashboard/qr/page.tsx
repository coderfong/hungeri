import QRCode from "qrcode";
import { Smartphone, ScanLine, BadgePercent } from "lucide-react";
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
    margin: 0,
    width: 320,
    errorCorrectionLevel: "H",
    color: { dark: "#1C1410", light: "#ffffff" },
  });

  const steps = [
    { icon: Smartphone, label: "Open your camera or the Hungeri app" },
    { icon: ScanLine, label: "Scan the code at the counter" },
    { icon: BadgePercent, label: "Show the redeemed screen to staff" },
  ];

  return (
    <div className="mx-auto max-w-xl px-5 py-6 md:px-8">
      <h1 className="mb-1 font-display text-2xl font-extrabold">Your redemption QR</h1>
      <p className="mb-6 text-sm text-ink-500">
        Print this and place it at your counter. Customers scan it to redeem deals — it’s
        unique to {business.name} and never changes.
      </p>

      {/* Branded counter card — designed to be printed as-is. */}
      <div className="hero-mesh mx-auto max-w-sm rounded-[28px] p-3 shadow-card">
        <div className="overflow-hidden rounded-[20px] bg-surface text-center shadow-e1">
          {/* Brand band */}
          <div className="relative overflow-hidden bg-gradient-to-r from-persimmon-600 via-persimmon-500 to-persimmon-400 px-6 pb-5 pt-5 text-white">
            <span
              aria-hidden
              className="pointer-events-none absolute -right-8 -top-10 size-32 rounded-full bg-white/15 blur-2xl"
            />
            <div className="relative flex items-center justify-center gap-2.5">
              <LogoMark className="size-10 rounded-[12px] shadow-e1" />
              <span className="font-display text-2xl font-extrabold tracking-tight">Hungeri</span>
            </div>
            <p className="relative mt-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/90">
              Scan · Redeem · Enjoy
            </p>
          </div>

          <div className="px-7 pt-6">
            <div className="font-display text-xl font-extrabold leading-tight">{business.name}</div>
            <p className="mt-1 text-xs font-semibold text-muted">
              Scan this code to redeem your deal
            </p>
          </div>

          {/* QR in a framed tile, Hungeri mark over the centre */}
          <div className="mx-auto mt-5 w-fit rounded-[22px] border-2 border-line bg-white p-4">
            <div className="relative mx-auto size-[220px] [&_svg]:h-full [&_svg]:w-full">
              <div className="size-full" dangerouslySetInnerHTML={{ __html: svg }} />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[14px] border-4 border-white bg-white shadow-e1">
                <LogoMark className="block size-10 rounded-[10px]" />
              </span>
            </div>
          </div>

          {/* Ticket divider with notches */}
          <div className="relative mt-6">
            <span aria-hidden className="absolute -left-3 top-1/2 size-6 -translate-y-1/2 rounded-full bg-bg" />
            <span aria-hidden className="absolute -right-3 top-1/2 size-6 -translate-y-1/2 rounded-full bg-bg" />
            <div className="mx-7 border-t-2 border-dashed border-line" />
          </div>

          {/* How it works */}
          <div className="space-y-2.5 px-7 pb-6 pt-5 text-left">
            {steps.map(({ icon: Icon, label }, i) => (
              <div key={label} className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-persimmon-50 font-display text-[13px] font-extrabold text-persimmon-600">
                  {i + 1}
                </span>
                <Icon className="size-4 shrink-0 text-persimmon-500" aria-hidden />
                <span className="text-[12.5px] font-bold text-ink-700">{label}</span>
              </div>
            ))}
            <p className="break-all pt-2 text-center font-mono text-[9px] text-ink-300">
              {redeemUrl}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-center print:hidden">
        <PrintButton />
      </div>
    </div>
  );
}
