const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** Validate uploads consistently and derive an extension from trusted MIME data. */
export function validateImageFile(file: File): string {
  const extension = IMAGE_EXTENSIONS[file.type];
  if (!extension) throw new Error("Choose a JPG, PNG, WebP, or GIF image.");
  if (file.size === 0) throw new Error("That image file is empty.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Images must be smaller than 8 MB.");
  return extension;
}
