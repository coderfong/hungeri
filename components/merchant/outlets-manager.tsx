"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Store, Trash2, Plus, Navigation, ImagePlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SG_AREAS } from "@/lib/geo/areas";
import { createClient } from "@/lib/supabase/client";
import { addOutlet, deleteOutlet, setOutletPhoto } from "@/lib/merchant/actions";
import type { LocationRow } from "@/types/database";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/merchant/image-upload";
import { DealImage } from "@/components/deal-image";
import { validateImageFile } from "@/lib/images/upload";

const inputCls =
  "w-full rounded-btn border-[1.5px] border-line bg-bg px-3.5 py-3 text-[15px] outline-none focus:border-persimmon-500 focus:ring-4 focus:ring-persimmon-100";

/** Outlet thumbnail + photo picker: tap to upload/replace the outlet's photo. */
function OutletPhoto({ outlet, onError }: { outlet: LocationRow; onError: (msg: string) => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    setBusy(true);
    try {
      const supabase = createClient();
      const ext = validateImageFile(file);
      const path = `outlets/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("deal-images")
        .upload(path, file, { cacheControl: "3600", contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("deal-images").getPublicUrl(path);
      const res = await setOutletPhoto(outlet.id, data.publicUrl);
      if (!res.ok) throw new Error(res.error);
      router.refresh();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative size-14 shrink-0">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        title={outlet.photo_url ? "Change outlet photo" : "Add outlet photo"}
        className="group relative flex size-14 items-center justify-center overflow-hidden rounded-xl bg-persimmon-50"
      >
        {outlet.photo_url ? (
          <DealImage
            src={outlet.photo_url}
            alt={outlet.address ?? "Outlet photo"}
            sizes="56px"
          />
        ) : (
          <Store className="size-5 text-persimmon-500" aria-hidden />
        )}
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-ink-900/45 text-white transition-opacity",
            busy ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <ImagePlus className="size-4" aria-hidden />
          )}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function OutletsManager({ outlets }: { outlets: LocationRow[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
    address: "",
    postal_code: "",
    lat: "",
    lng: "",
    phone: "",
    photo_url: "",
  });

  function save() {
    setError(null);
    start(async () => {
      const res = await addOutlet({
        address: form.address,
        postal_code: form.postal_code || undefined,
        lat: Number(form.lat),
        lng: Number(form.lng),
        phone: form.phone || undefined,
        photo_url: form.photo_url || undefined,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setForm({ address: "", postal_code: "", lat: "", lng: "", phone: "", photo_url: "" });
      setAdding(false);
      router.refresh();
    });
  }

  function remove(id: string) {
    start(async () => {
      await deleteOutlet(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {error && !adding && <p className="text-sm font-semibold text-error">{error}</p>}
      {outlets.map((o) => (
        <div key={o.id} className="flex items-center gap-3 rounded-card border border-line-soft bg-surface p-4">
          <OutletPhoto outlet={o} onError={setError} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold">{o.address}</div>
            <div className="text-xs text-muted">
              {[o.postal_code, o.phone].filter(Boolean).join(" · ")}
            </div>
          </div>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${o.lat},${o.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open in maps"
            className="text-ink-500 hover:text-persimmon-500"
          >
            <Navigation className="size-4" aria-hidden />
          </a>
          <button
            onClick={() => remove(o.id)}
            disabled={pending}
            aria-label="Delete outlet"
            className="text-ink-500 hover:text-error"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>
      ))}

      {adding ? (
        <div className="rounded-card border border-line-soft bg-surface p-4">
          {error && <p className="mb-2 text-sm font-semibold text-error">{error}</p>}
          <input
            className={cn(inputCls, "mb-2")}
            placeholder="Address"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
          <div className="mb-2 grid grid-cols-2 gap-2">
            <input
              className={inputCls}
              placeholder="Postal code"
              value={form.postal_code}
              onChange={(e) => setForm((f) => ({ ...f, postal_code: e.target.value }))}
            />
            <input
              className={inputCls}
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
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
          <div className="mb-2 grid grid-cols-2 gap-2">
            <input
              className={inputCls}
              placeholder="Latitude"
              value={form.lat}
              onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
            />
            <input
              className={inputCls}
              placeholder="Longitude"
              value={form.lng}
              onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
            />
          </div>
          <div className="mb-3">
            <ImageUpload
              value={form.photo_url}
              onChange={(url) => setForm((f) => ({ ...f, photo_url: url }))}
              pathPrefix="outlets"
              label="Outlet photo (optional) · JPG/PNG"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button size="sm" disabled={pending || !form.address || !form.lat} onClick={save}>
              {pending ? "Saving…" : "Add outlet"}
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex w-full items-center justify-center gap-2 rounded-card border-[1.5px] border-dashed border-ink-300 py-4 text-sm font-bold text-persimmon-500"
        >
          <Plus className="size-[18px]" aria-hidden /> Add another outlet
        </button>
      )}
    </div>
  );
}
