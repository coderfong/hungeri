"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { SG_AREAS } from "@/lib/geo/areas";
import { createBusinessAdmin } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/merchant/image-upload";

const inputCls =
  "w-full rounded-btn border-[1.5px] border-line bg-bg px-3.5 py-3 text-[15px] outline-none focus:border-persimmon-500 focus:ring-4 focus:ring-persimmon-100";

const EMPTY = {
  name: "",
  description: "",
  cuisine: "",
  price_level: "",
  website: "",
  cover_url: "",
  address: "",
  postal_code: "",
  phone: "",
  lat: "",
  lng: "",
};

/** Admin-only "Add business" form: creates a live business with its first outlet. */
export function AddBusinessForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [pending, start] = useTransition();

  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  function save() {
    setError(null);
    start(async () => {
      const res = await createBusinessAdmin({
        name: form.name,
        description: form.description || undefined,
        cuisine_tags: form.cuisine
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        price_level: form.price_level ? Number(form.price_level) : undefined,
        website: form.website || "",
        cover_url: form.cover_url || "",
        outlet: {
          address: form.address,
          postal_code: form.postal_code || undefined,
          lat: Number(form.lat),
          lng: Number(form.lng),
          phone: form.phone || undefined,
        },
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setForm(EMPTY);
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-[18px]" aria-hidden /> Add business
      </Button>
    );
  }

  return (
    <div className="w-full rounded-card border border-line-soft bg-surface p-5">
      <div className="mb-4 flex items-center gap-2">
        <Store className="size-5 text-persimmon-500" aria-hidden />
        <h2 className="font-display text-lg font-extrabold">Add a business</h2>
      </div>
      {error && <p className="mb-3 text-sm font-semibold text-error">{error}</p>}

      <input className={cn(inputCls, "mb-2")} placeholder="Business name" value={form.name} onChange={set("name")} />
      <textarea
        className={cn(inputCls, "mb-2 min-h-20 resize-y")}
        placeholder="Description (optional)"
        value={form.description}
        onChange={set("description")}
      />
      <div className="mb-2 grid gap-2 sm:grid-cols-3">
        <input
          className={inputCls}
          placeholder="Cuisines (comma-separated)"
          value={form.cuisine}
          onChange={set("cuisine")}
        />
        <select className={inputCls} value={form.price_level} onChange={set("price_level")}>
          <option value="">Price level…</option>
          <option value="1">$</option>
          <option value="2">$$</option>
          <option value="3">$$$</option>
          <option value="4">$$$$</option>
        </select>
        <input className={inputCls} placeholder="Website (optional)" value={form.website} onChange={set("website")} />
      </div>

      <div className="mb-4">
        <ImageUpload
          value={form.cover_url}
          onChange={(url) => setForm((f) => ({ ...f, cover_url: url }))}
          pathPrefix="shops"
          label="Cover photo (optional) · JPG/PNG"
        />
      </div>

      <div className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">First outlet</div>
      <input className={cn(inputCls, "mb-2")} placeholder="Address" value={form.address} onChange={set("address")} />
      <div className="mb-2 grid grid-cols-2 gap-2">
        <input className={inputCls} placeholder="Postal code" value={form.postal_code} onChange={set("postal_code")} />
        <input className={inputCls} placeholder="Phone" value={form.phone} onChange={set("phone")} />
      </div>
      <select
        className={cn(inputCls, "mb-2")}
        defaultValue=""
        onChange={(e) => {
          const a = SG_AREAS.find((x) => x.name === e.target.value);
          if (a) setForm((f) => ({ ...f, lat: String(a.lat), lng: String(a.lng) }));
        }}
      >
        <option value="" disabled>
          Quick-set coordinates from an area…
        </option>
        {SG_AREAS.map((a) => (
          <option key={a.name} value={a.name}>
            {a.name}
          </option>
        ))}
      </select>
      <div className="mb-4 grid grid-cols-2 gap-2">
        <input className={inputCls} placeholder="Latitude" value={form.lat} onChange={set("lat")} />
        <input className={inputCls} placeholder="Longitude" value={form.lng} onChange={set("lng")} />
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button size="sm" disabled={pending || !form.name || !form.address || !form.lat} onClick={save}>
          {pending ? "Creating…" : "Create business"}
        </Button>
      </div>
    </div>
  );
}
