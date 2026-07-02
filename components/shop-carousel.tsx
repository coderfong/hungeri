"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BadgeCheck, ChevronLeft, ChevronRight } from "lucide-react";
import type { FeaturedBanner } from "@/config/featured-banners";
import { DealImage } from "@/components/deal-image";
import { FeaturedLabel } from "@/components/ui/badges";
import { cn } from "@/lib/utils";

const AUTOPLAY_MS = 5000;

/**
 * Big full-width banner carousel for the featured/spotlight listings — one large
 * banner at a time, auto-advancing, with swipe, prev/next arrows, and dots.
 */
export function ShopCarousel({ banners }: { banners: FeaturedBanner[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const count = banners.length;

  const goTo = useCallback(
    (i: number) => {
      const el = ref.current;
      if (!el) return;
      const idx = ((i % count) + count) % count;
      el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
    },
    [count],
  );

  // Keep the active dot in sync with the scroll position.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() =>
        setActive(Math.round(el.scrollLeft / el.clientWidth)),
      );
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Auto-advance; pauses while the pointer is over the carousel.
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (count <= 1 || paused) return;
    const id = setInterval(() => goTo(active + 1), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [active, count, paused, goTo]);

  return (
    <div
      className="group relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        ref={ref}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
      >
        {banners.map((banner, i) => (
          <ShopBanner key={banner.slug} banner={banner} priority={i === 0} />
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(active - 1)}
            aria-label="Previous"
            className="absolute left-7 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 p-2.5 shadow-e2 opacity-0 transition-opacity hover:bg-surface group-hover:opacity-100 sm:flex md:left-10"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => goTo(active + 1)}
            aria-label="Next"
            className="absolute right-7 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 p-2.5 shadow-e2 opacity-0 transition-opacity hover:bg-surface group-hover:opacity-100 sm:flex md:right-10"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>

          <div className="mt-3 flex items-center justify-center gap-2">
            {banners.map((banner, i) => (
              <button
                key={banner.slug}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === active}
                className={cn(
                  "h-2 rounded-pill transition-all",
                  i === active
                    ? "w-6 bg-persimmon-500"
                    : "w-2 bg-ink-300 hover:bg-ink-500",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** One full-width banner slide. */
function ShopBanner({ banner, priority }: { banner: FeaturedBanner; priority?: boolean }) {
  const { name, image, href, external, verified, featured, deals, cuisine, savings } = banner;

  const inner = (
    <>
      <DealImage src={image} alt={name} priority={priority} sizes="(max-width: 768px) 100vw, 1100px" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
      <span className="absolute left-4 top-4 md:left-6 md:top-6">
        {featured ? (
          <FeaturedLabel short />
        ) : (
          <span className="rounded-[9px] bg-ink-900/80 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-white backdrop-blur">
            Top pick
          </span>
        )}
      </span>
      <div className="absolute inset-x-4 bottom-4 text-white md:inset-x-6 md:bottom-6">
        <h3 className="flex items-center gap-2 font-display text-[28px] font-extrabold leading-none tracking-tight md:text-[40px]">
          <span className="truncate">{name}</span>
          {verified && <BadgeCheck className="size-6 shrink-0 md:size-7" aria-hidden />}
        </h3>
        {(deals != null || cuisine || savings) && (
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[13px] font-semibold md:text-sm">
            {deals != null && (
              <span className="rounded-pill bg-white/20 px-2.5 py-1 backdrop-blur">
                {deals} {deals === 1 ? "deal" : "deals"}
              </span>
            )}
            {cuisine && <span className="opacity-90">{cuisine}</span>}
            {savings && (
              <span className="rounded-[7px] bg-savings px-2.5 py-1 text-[12px] font-extrabold md:text-[13px]">
                {savings}
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );

  const className =
    "relative block h-[190px] overflow-hidden rounded-card-lg border-[1.5px] border-ad-border bg-surface shadow-e3 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-persimmon-100 sm:h-[260px] md:h-[320px]";

  return (
    <div className="w-full shrink-0 snap-center px-5 md:px-7">
      {external ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
          {inner}
        </a>
      ) : (
        <Link href={href} className={className}>
          {inner}
        </Link>
      )}
    </div>
  );
}
