"use client";

import { useEffect, useRef, useState } from "react";
import { X, QrCode, Check, Camera, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/logo";

/**
 * Redeem-by-scan flow. Opens the device camera, reads the shop's static QR, and
 * verifies it server-side against the deal's business (proves the customer is at
 * the outlet) before recording the redemption.
 */
type Phase = "idle" | "scanning" | "verifying" | "success" | "error";

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const READER_ID = "hungeri-qr-reader";

export function RedeemFlow({ dealId }: { dealId: string }) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState<string>("");
  const [result, setResult] = useState<{ shop?: string; code?: string | null } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null);

  async function stopScanner() {
    try {
      await scannerRef.current?.stop();
      await scannerRef.current?.clear();
    } catch {
      /* already stopped */
    }
    scannerRef.current = null;
  }

  async function verify(token: string) {
    setPhase("verifying");
    try {
      const res = await fetch("/api/redemptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deal_id: dealId, shop_token: token }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.message ?? "That QR didn't match this shop. Scan the code at the counter.");
        setPhase("error");
        return;
      }
      setResult({ shop: json.shop, code: json.code });
      setPhase("success");
    } catch {
      setMessage("Something went wrong. Try again.");
      setPhase("error");
    }
  }

  // Start/stop the camera with the modal's scanning phase.
  useEffect(() => {
    if (!open || phase !== "scanning") return;
    let cancelled = false;

    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        const scanner = new Html5Qrcode(READER_ID);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded: string) => {
            const token = decoded.match(UUID_RE)?.[0];
            if (!token) return;
            stopScanner();
            verify(token);
          },
          () => {},
        );
      } catch {
        if (!cancelled) {
          setMessage("Couldn't open the camera. Check permissions and try again.");
          setPhase("error");
        }
      }
    })();

    return () => {
      cancelled = true;
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, phase]);

  function launch() {
    setResult(null);
    setMessage("");
    setPhase("scanning");
    setOpen(true);
  }
  function close() {
    stopScanner();
    setOpen(false);
    setPhase("idle");
  }

  return (
    <>
      <Button size="lg" className="w-full" onClick={launch}>
        <QrCode className="size-5" aria-hidden /> Scan to redeem
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-900/60" onClick={close} aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Scan to redeem"
            className="relative w-full max-w-md overflow-hidden rounded-[20px] bg-surface"
          >
            {/* Branded header */}
            <div className="flex items-center gap-2.5 bg-gradient-to-r from-persimmon-600 to-persimmon-400 px-5 py-3.5 text-white">
              <LogoMark className="size-8 rounded-[9px]" />
              <h2 className="font-display text-lg font-extrabold">Scan to redeem</h2>
              <button onClick={close} aria-label="Close" className="ml-auto text-white/90 hover:text-white">
                <X className="size-5" aria-hidden />
              </button>
            </div>

            <div className="p-5">
              {phase === "scanning" && (
                <>
                  <div className="relative overflow-hidden rounded-card">
                    <div id={READER_ID} className="aspect-square w-full bg-ink-900" />
                    {/* Aiming frame over the camera view */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-8 rounded-[18px] border-2 border-dashed border-white/70"
                    />
                  </div>
                  <p className="mt-3 flex items-center justify-center gap-2 text-center text-sm font-semibold text-ink-500">
                    <Camera className="size-4 text-persimmon-500" aria-hidden />
                    Point at the Hungeri QR at the counter
                  </p>
                </>
              )}

              {phase === "verifying" && (
                <div className="flex flex-col items-center gap-3 py-10 text-sm font-semibold text-ink-500">
                  <LogoMark className="size-10 animate-pulse rounded-xl" />
                  Verifying…
                </div>
              )}

              {phase === "success" && (
                <div className="py-3 text-center">
                  <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-savings-bg ring-8 ring-savings-bg/50">
                    <Check className="size-8 text-savings" strokeWidth={3} aria-hidden />
                  </div>
                  <div className="font-display text-2xl font-extrabold">Redeemed!</div>
                  <p className="mt-1 text-sm text-ink-500">
                    Show this to staff at {result?.shop ?? "the counter"}.
                  </p>
                  {result?.code && (
                    <div className="mx-auto mt-4 inline-block rounded-card border-2 border-dashed border-line bg-bg px-6 py-3.5">
                      <div className="text-[10px] font-extrabold uppercase tracking-widest text-muted">
                        Your code
                      </div>
                      <div className="font-mono text-2xl font-bold tracking-[0.2em] text-ink-900">
                        {result.code}
                      </div>
                    </div>
                  )}
                  <Button className="mt-5 w-full" onClick={close}>
                    Done
                  </Button>
                </div>
              )}

              {phase === "error" && (
                <div className="py-3 text-center">
                  <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-urgent-bg">
                    <AlertTriangle className="size-8 text-urgent" aria-hidden />
                  </div>
                  <p className="text-sm font-semibold text-ink-700">{message}</p>
                  <Button className="mt-5 w-full" onClick={launch}>
                    Try again
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
