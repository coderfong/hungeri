"use client";

import { useRef, useState } from "react";
import { Eye, ImagePlus, Loader2, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DealImage } from "@/components/deal-image";
import { validateImageFile } from "@/lib/images/upload";

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
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const ext = validateImageFile(file);
      const path = `${pathPrefix}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("deal-images")
        .upload(path, file, { cacheControl: "3600", contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("deal-images").getPublicUrl(path);
      if (!data.publicUrl) throw new Error("The upload finished, but no photo URL was returned.");
      onChange(data.publicUrl);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Upload failed — is the deal-images bucket set up?",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {value ? (
        <div className="relative h-44 overflow-hidden rounded-card border border-line bg-line-soft">
          <DealImage src={value} alt="Uploaded photo preview" sizes="400px" />
          <div className="absolute right-2 top-2 flex gap-2">
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View full photo"
              className="flex size-9 items-center justify-center rounded-full bg-white/95 text-ink-700 shadow-e1"
            >
              <Eye className="size-4" aria-hidden />
            </a>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              aria-label="Replace photo"
              className="flex size-9 items-center justify-center rounded-full bg-white/95 text-ink-700 shadow-e1"
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Upload className="size-4" aria-hidden />
              )}
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Remove photo"
              className="flex size-9 items-center justify-center rounded-full bg-white/95 text-error shadow-e1"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-card border-[1.5px] border-dashed border-ink-300 px-6 py-6 text-center text-sm font-semibold text-muted hover:border-persimmon-300 disabled:cursor-wait"
        >
          {uploading ? (
            <Loader2 className="size-6 animate-spin text-persimmon-500" aria-hidden />
          ) : (
            <ImagePlus className="size-6 text-persimmon-500" aria-hidden />
          )}
          <span>{uploading ? "Uploading…" : label}</span>
        </button>
      )}
      {error && <p className="mt-2 text-xs font-semibold text-error">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
