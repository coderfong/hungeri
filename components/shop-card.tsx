import Link from "next/link";
import { BadgeCheck, Tag as TagIcon } from "lucide-react";
import type { ShopListing } from "@/lib/deals/query";
import { dealBadge, savingsLabel } from "@/lib/deals/format";
import { DealImage } from "@/components/deal-image";
import { DealTypeBadge, SavingsBadge, PriceLevel, FeaturedLabel } from "@/components/ui/badges";

/** Small "N deals" detail shown beside the shop name. */
function DealCountTag({ count }: { count: number }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-pill bg-line-soft px-2.5 py-1 text-[11px] font-extrabold text-ink-500">
      <TagIcon className="size-3" aria-hidden />
      {count} {count === 1 ? "deal" : "deals"}
    </span>
  );
}

/** Standard shop listing card — the SHOP is the headline; deals are a side detail. */
export function ShopCard({ shop }: { shop: ShopListing }) {
  const { business: biz, headline, dealCount } = shop;
  const savings = savingsLabel(headline);
  return (
    <Link
      href={`/b/${biz.slug}`}
      className="block overflow-hidden rounded-card-lg border border-line-soft bg-surface shadow-card transition-shadow hover:shadow-e2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-persimmon-100"
    >
      <div className="relative h-[150px]">
        <DealImage src={headline.image_url} alt={biz.name} />
        <span className="absolute left-3 top-3">
          <DealTypeBadge label={dealBadge(headline)} />
        </span>
      </div>
      <div className="p-[15px]">
        {/* Shop name is the main header; deal count sits to the side */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="flex min-w-0 items-center gap-1.5 font-display text-[20px] font-extrabold leading-tight tracking-tight">
            <span className="truncate">{biz.name}</span>
            {biz.verified && <BadgeCheck className="size-[18px] shrink-0 text-persimmon-500" aria-hidden />}
          </h3>
          <DealCountTag count={dealCount} />
        </div>
        {/* Secondary line: cuisine · price · best saving */}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
          {biz.cuisine_tags[0] && <span>{biz.cuisine_tags[0]}</span>}
          <PriceLevel level={biz.price_level} />
          {savings && <SavingsBadge className="ml-auto px-2 py-0.5 text-[11px]">{savings}</SavingsBadge>}
        </div>
      </div>
    </Link>
  );
}

/** Large carousel slide — shop name headlines; deals are a small detail line. */
export function ShopHeroCard({ shop }: { shop: ShopListing }) {
  const { business: biz, headline, dealCount, featured } = shop;
  const savings = savingsLabel(headline);
  return (
    <Link
      href={`/b/${biz.slug}`}
      className="block w-[300px] shrink-0 snap-start overflow-hidden rounded-card-lg border-[1.5px] border-ad-border bg-surface shadow-e3 sm:w-[360px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-persimmon-100"
    >
      <div className="relative h-[190px]">
        <DealImage src={headline.image_url} alt={biz.name} priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
        <span className="absolute left-3 top-3">
          {featured ? (
            <FeaturedLabel short />
          ) : (
            <span className="rounded-[9px] bg-ink-900/80 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-white backdrop-blur">
              Top pick
            </span>
          )}
        </span>
        <div className="absolute inset-x-4 bottom-3.5 text-white">
          <h3 className="flex items-center gap-1.5 font-display text-[26px] font-extrabold leading-none tracking-tight">
            <span className="truncate">{biz.name}</span>
            {biz.verified && <BadgeCheck className="size-5 shrink-0" aria-hidden />}
          </h3>
          {/* Deals as a small detail line */}
          <div className="mt-1.5 flex items-center gap-2 text-[12px] font-semibold">
            <span className="rounded-pill bg-white/20 px-2 py-0.5 backdrop-blur">
              {dealCount} {dealCount === 1 ? "deal" : "deals"}
            </span>
            {biz.cuisine_tags[0] && <span className="opacity-90">{biz.cuisine_tags[0]}</span>}
            {savings && (
              <span className="ml-auto rounded-[7px] bg-savings px-2 py-0.5 text-[11px] font-extrabold">
                {savings}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
