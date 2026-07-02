"use client";

import { useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Uploads an image to the public `deal-images` storage bucket and returns its
 * public URL via onChange. Falls back gracefully if the bucket/policies aren't
 * set up yet (run migration 0008). Image is optional everywhere.
 */
export function ImageUpload({
  value,
  onChange,
  pathPrefix,
  label = "Drag a photo here · JPG/PNG",
}: {
  value: string;
  onChange: (url: string) => void;
  pathPrefix: string;
  label?: string;
}) {
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${pathPrefix}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("deal-images")
        .upload(path, file, { upsert: true, cacheControl: "3600" });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("deal-images").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Upload failed — is the deal-images bucket set up?",
      );
    } finally {
      setUploading(false);
    }
  }

  if (value) {
    return (
      <div className="relative h-40 overflow-hidden rounded-card border border-line">
        <Image src={value} alt="Deal image" fill className="object-cover" sizes="400px" />
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Remove image"
          className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/90 shadow-e1"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-card border-[1.5px] border-dashed border-ink-300 px-6 py-6 text-center text-sm font-semibold text-muted hover:border-persimmon-300">
      {uploading ? (
        <Loader2 className="size-6 animate-spin text-persimmon-500" aria-hidden />
      ) : (
        <ImagePlus className="size-6 text-persimmon-500" aria-hidden />
      )}
      <span>{uploading ? "Uploading…" : label}</span>
      {error && <span className="text-xs font-medium text-error">{error}</span>}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </label>
  );
}
