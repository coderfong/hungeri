"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft, Plus, Trash2, ShieldCheck, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { CUISINES, PRICE_LEVELS } from "@/lib/deals/facets";
import { SG_AREAS } from "@/lib/geo/areas";
import { finishOnboarding } from "@/lib/merchant/actions";
import type { OnboardingInput } from "@/lib/merchant/schema";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/logo";
import { ImageUpload } from "@/components/merchant/image-upload";

const inputCls =
  "w-full rounded-btn border-[1.5px] border-line bg-bg px-3.5 py-3 text-[15px] outline-none focus:border-persimmon-500 focus:ring-4 focus:ring-persimmon-100";

type OutletDraft = {
  address: string;
  postal_code: string;
  area: string;
  phone: string;
};

const emptyOutlet: OutletDraft = { address: "", postal_code: "", area: "", phone: "" };

export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Step 1
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [priceLevel, setPriceLevel] = useState<number | null>(null);
  const [logoUrl, setLogoUrl] = useState("");

  // Step 2
  const [outlets, setOutlets] = useState<OutletDraft[]>([{ ...emptyOutlet }]);

  // Step 3
  const [uen, setUen] = useState("");

  const progress = step === 1 ? "33%" : step === 2 ? "66%" : "100%";

  function updateOutlet(i: number, patch: Partial<OutletDraft>) {
    setOutlets((prev) => prev.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
  }

  async function submit() {
    setError(null);
    setBusy(true);
    const input: OnboardingInput = {
      business: {
        name,
        description: description || undefined,
        cuisine_tags: cuisines,
        price_level: priceLevel ?? undefined,
        logo_url: logoUrl || undefined,
      },
      outlets: outlets.flatMap((o) => {
        const area = SG_AREAS.find((candidate) => candidate.name === o.area);
        if (!o.address || !area) return [];
        return [{
          address: o.address,
          postal_code: o.postal_code || undefined,
          lat: area.lat,
          lng: area.lng,
          phone: o.phone || undefined,
        }];
      }),
      uen: uen || undefined,
    };
    const res = await finishOnboarding(input);
    // finishOnboarding redirects on success; only failures return here.
    setBusy(false);
    if (res && !res.ok) setError(res.error);
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="overflow-hidden rounded-[20px] border border-line bg-surface shadow-e2">
        <div className="h-1.5 bg-line-soft">
          <div
            className={cn("h-1.5 transition-all", step === 3 ? "bg-savings" : "bg-persimmon-500")}
            style={{ width: progress }}
          />
        </div>

        <div className="p-7">
          <div className="mb-5 flex items-center gap-2.5">
            {step > 1 ? (
              <button onClick={() => setStep((s) => s - 1)} aria-label="Back">
                <ArrowLeft className="size-5" aria-hidden />
              </button>
            ) : (
              <LogoMark className="size-8 rounded-[10px]" />
            )}
            <span className="font-display text-lg font-extrabold">
              {step === 1 ? "Tell us about your business" : step === 2 ? "Add your outlets" : "Verify your business"}
            </span>
            <span className="ml-auto text-[13px] font-bold text-muted">Step {step} of 3</span>
          </div>

          {error && (
            <p className="mb-4 rounded-btn bg-urgent-bg px-3.5 py-2.5 text-sm font-semibold text-urgent">
              {error}
            </p>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <div className="mb-1.5 text-[13px] font-bold">Business name</div>
                <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Gong Cha" />
              </div>
              <div>
                <div className="mb-1.5 text-[13px] font-bold">Cuisine tags</div>
                <div className="flex flex-wrap gap-2">
                  {CUISINES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCuisines((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]))}
                      className={cn(
                        "rounded-pill px-3 py-1.5 text-[13px] font-semibold",
                        cuisines.includes(c)
                          ? "bg-persimmon-500 text-white"
                          : "border-[1.5px] border-line bg-surface text-ink-700",
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1.5 text-[13px] font-bold">Price level</div>
                <div className="flex gap-2">
                  {PRICE_LEVELS.map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setPriceLevel(lvl)}
                      className={cn(
                        "flex-1 rounded-[11px] py-3 text-center font-extrabold",
                        priceLevel === lvl
                          ? "bg-ink-900 text-white"
                          : "border-[1.5px] border-line bg-bg text-muted",
                      )}
                    >
                      {"$".repeat(lvl)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1.5 text-[13px] font-bold">Description</div>
                <textarea
                  rows={2}
                  className={cn(inputCls, "resize-none")}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Taiwanese bubble tea since 2006…"
                />
              </div>
              <div>
                <div className="mb-1.5 text-[13px] font-bold">Logo</div>
                <ImageUpload value={logoUrl} onChange={setLogoUrl} pathPrefix="logos" label="Upload logo · PNG" />
              </div>
              <Button size="lg" className="w-full" disabled={!name} onClick={() => setStep(2)}>
                Continue <ArrowRight className="size-[18px]" aria-hidden />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-ink-500">Where can diners redeem your deals? Add every branch.</p>
              {outlets.map((o, i) => (
                <div key={i} className="rounded-card border border-line-soft p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Store className="size-[18px] text-persimmon-500" aria-hidden />
                    <span className="text-sm font-bold">Outlet {i + 1}</span>
                    {outlets.length > 1 && (
                      <button
                        onClick={() => setOutlets((p) => p.filter((_, idx) => idx !== i))}
                        aria-label="Remove outlet"
                        className="ml-auto text-muted hover:text-error"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    )}
                  </div>
                  <input
                    className={cn(inputCls, "mb-2")}
                    value={o.address}
                    onChange={(e) => updateOutlet(i, { address: e.target.value })}
                    placeholder="Address, e.g. 313 Orchard Rd #B3-01"
                  />
                  <div className="mb-2 grid grid-cols-2 gap-2">
                    <input
                      className={inputCls}
                      value={o.postal_code}
                      onChange={(e) => updateOutlet(i, { postal_code: e.target.value })}
                      placeholder="Postal code"
                    />
                    <input
                      className={inputCls}
                      value={o.phone}
                      onChange={(e) => updateOutlet(i, { phone: e.target.value })}
                      placeholder="Phone (optional)"
                    />
                  </div>
                  <select
                    className={inputCls}
                    value={o.area}
                    onChange={(e) => updateOutlet(i, { area: e.target.value })}
                  >
                    <option value="" disabled>
                      Select the nearest area
                    </option>
                    {SG_AREAS.map((a) => (
                      <option key={a.name} value={a.name}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              <button
                onClick={() => setOutlets((p) => [...p, { ...emptyOutlet }])}
                className="flex w-full items-center justify-center gap-2 rounded-card border-[1.5px] border-dashed border-ink-300 py-4 text-sm font-bold text-persimmon-500"
              >
                <Plus className="size-[18px]" aria-hidden /> Add another outlet
              </button>
              <Button
                size="lg"
                className="w-full"
                disabled={!outlets.some((o) => o.address && o.area)}
                onClick={() => setStep(3)}
              >
                Continue <ArrowRight className="size-[18px]" aria-hidden />
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-ink-500">
                A quick check keeps Hungeri trustworthy for diners. We review within 1 business day.
                You can publish deals now — they go live after review.
              </p>
              <div>
                <div className="mb-1.5 text-[13px] font-bold">UEN (business registration) · optional</div>
                <input
                  className={cn(inputCls, "font-mono")}
                  value={uen}
                  onChange={(e) => setUen(e.target.value)}
                  placeholder="201912345A"
                />
              </div>
              <div className="flex items-start gap-2.5 rounded-btn bg-savings-bg px-4 py-3.5">
                <ShieldCheck className="size-5 shrink-0 text-savings" aria-hidden />
                <p className="text-[13px] font-semibold leading-relaxed text-[#0A6B3B]">
                  Verified businesses get a badge, higher placement, and access to paid boosts.
                </p>
              </div>
              <Button size="lg" className="w-full" disabled={busy} onClick={submit}>
                {busy ? "Submitting…" : "Submit & open dashboard"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
