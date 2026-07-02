"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CUISINES, PRICE_LEVELS } from "@/lib/deals/facets";
import { updateBusiness, setBusinessStatus } from "@/lib/merchant/actions";
import type { BusinessRow } from "@/types/database";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/merchant/image-upload";

const inputCls =
  "w-full rounded-btn border-[1.5px] border-line bg-bg px-3.5 py-3 text-[15px] outline-none focus:border-persimmon-500 focus:ring-4 focus:ring-persimmon-100";

export function BusinessSettingsForm({ business }: { business: BusinessRow }) {
  const router = useRouter();
  const [name, setName] = useState(business.name);
  const [description, setDescription] = useState(business.description ?? "");
  const [cuisines, setCuisines] = useState<string[]>(business.cuisine_tags ?? []);
  const [priceLevel, setPriceLevel] = useState<number | null>(business.price_level);
  const [website, setWebsite] = useState(business.website ?? "");
  const [logoUrl, setLogoUrl] = useState(business.logo_url ?? "");
  const [coverUrl, setCoverUrl] = useState(business.cover_url ?? "");
  const [status, setStatus] = useState(business.status);

  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save() {
    setMsg(null);
    setError(null);
    start(async () => {
      const res = await updateBusiness({
        name,
        description: description || undefined,
        cuisine_tags: cuisines,
        price_level: priceLevel ?? undefined,
        website: website || "",
        logo_url: logoUrl || "",
        cover_url: coverUrl || "",
      });
      if (!res.ok) setError(res.error);
      else {
        setMsg("Saved.");
        router.refresh();
      }
    });
  }

  function togglePublish() {
    const next = status === "live" ? "draft" : "live";
    start(async () => {
      const res = await setBusinessStatus(next);
      if (res.ok) {
        setStatus(next);
        router.refresh();
      } else setError(res.error);
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-card border border-line-soft bg-surface p-4">
        <div className="flex-1">
          <div className="text-sm font-bold">Storefront {status === "live" ? "is live" : "is hidden"}</div>
          <div className="text-xs text-muted">
            {status === "live"
              ? "Diners can see your profile and live deals."
              : "Publish to appear on Hungeri. Individual deals still go through review."}
          </div>
        </div>
        <Button variant={status === "live" ? "outline" : "primary"} size="sm" disabled={pending} onClick={togglePublish}>
          {status === "live" ? "Unpublish" : "Publish storefront"}
        </Button>
      </div>

      <div>
        <div className="mb-1.5 text-[13px] font-bold">Business name</div>
        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <div className="mb-1.5 text-[13px] font-bold">Description</div>
        <textarea
          rows={3}
          className={cn(inputCls, "resize-none")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
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
                cuisines.includes(c) ? "bg-persimmon-500 text-white" : "border-[1.5px] border-line bg-surface text-ink-700",
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
                priceLevel === lvl ? "bg-ink-900 text-white" : "border-[1.5px] border-line bg-bg text-muted",
              )}
            >
              {"$".repeat(lvl)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-1.5 text-[13px] font-bold">Website</div>
        <input className={inputCls} value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-1.5 text-[13px] font-bold">Logo</div>
          <ImageUpload value={logoUrl} onChange={setLogoUrl} pathPrefix={`${business.id}/logo`} label="Upload logo" />
        </div>
        <div>
          <div className="mb-1.5 text-[13px] font-bold">Cover</div>
          <ImageUpload value={coverUrl} onChange={setCoverUrl} pathPrefix={`${business.id}/cover`} label="Upload cover" />
        </div>
      </div>

      {error && <p className="text-sm font-semibold text-error">{error}</p>}
      {msg && <p className="text-sm font-semibold text-savings">{msg}</p>}

      <Button disabled={pending} onClick={save}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}
