import Image from "next/image";
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
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes ?? "(max-width: 768px) 100vw, 400px"}
        className={cn("object-cover", className)}
        priority={priority}
      />
    );
  }
  return (
    <div
      aria-hidden
      className={cn(
        "size-full bg-[repeating-linear-gradient(135deg,#FFE3D2_0_12px,#FFEDE2_12px_24px)]",
        className,
      )}
    />
  );
}
