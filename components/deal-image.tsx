"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Deal/cover imagery. Falls back to the warm diagonal-stripe placeholder from
 * the design when no image_url is set (most seeded deals).
 */
export function DealImage({
  src,
  alt,
  className,
  sizes,
  priority,
}: {
  src: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (src && failedSrc !== src) {
    const isRemote = /^https?:\/\//i.test(src);
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes ?? "(max-width: 768px) 100vw, 400px"}
        className={cn("object-cover", className)}
        priority={priority}
        // Merchant uploads can come from local or hosted Supabase instances.
        // Serving remote uploads directly avoids a hard render failure when the
        // storage hostname differs from the one present at build time.
        unoptimized={isRemote}
        onError={() => setFailedSrc(src)}
      />
    );
  }
  return <div aria-hidden className={cn("img-placeholder size-full", className)} />;
}
