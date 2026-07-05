"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DealImage } from "@/components/deal-image";
import { setShopHeadlineImage } from "@/lib/admin/shop-image";

/**
 * Shop cover image with an inline uploader for admins / super-merchants.
 * Drag a photo onto it (or tap "Add photo") to set the shop's headline image.
 * Lives inside the card's <Link>, so every interactive handler stops the click
 * from navigating.
 */
export function EditableShopImage({
  dealId,
  src,
  alt,
}: {
  dealId: string;
  src: string | null;
  alt: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function stop(e: { preventDefault: () => void; stopPropagation: () => void }) {
    e.preventDefault();
    e.stopPropagation();
  }

  async function upload(file: File) {
    setError(null);
    setBusy(true);
    try {
      if (!file.type.startsWith("image/")) throw new Error("Drop an image file.");
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `shops/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("deal-images")
        .upload(path, file, { upsert: true, cacheControl: "3600" });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("deal-images").getPublicUrl(path);
      const res = await setShopHeadlineImage(dealId, data.publicUrl);
      if (!res.ok) throw new Error(res.error ?? "Could not save the image.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="relative size-full"
      onDragOver={(e) => {
        stop(e);
        setDragging(true);
      }}
      onDragLeave={(e) => {
        stop(e);
        setDragging(false);
      }}
      onDrop={(e) => {
        stop(e);
        setDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) upload(f);
      }}
    >
      <DealImage src={src} alt={alt} />

      <button
        type="button"
        onClick={(e) => {
          stop(e);
          inputRef.current?.click();
        }}
        className="absolute bottom-2 right-2 z-20 inline-flex items-center gap-1 rounded-full bg-ink-900/80 px-2.5 py-1.5 text-[11px] font-bold text-white backdrop-blur hover:bg-ink-900"
      >
        {busy ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
        ) : (
          <ImagePlus className="size-3.5" aria-hidden />
        )}
        {busy ? "Uploading…" : src ? "Change photo" : "Add photo"}
      </button>

      {(dragging || busy) && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-persimmon-500/20 ring-2 ring-inset ring-persimmon-500">
          <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-persimmon-700">
            {busy ? "Uploading…" : "Drop to upload"}
          </span>
        </div>
      )}

      {error && (
        <span className="absolute inset-x-2 bottom-11 z-20 rounded bg-white/95 px-2 py-1 text-[11px] font-semibold text-error">
          {error}
        </span>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
        }}
      />
    </div>
  );
}
