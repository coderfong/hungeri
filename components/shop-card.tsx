import Link from "next/link";
import { BadgeCheck, Tag as TagIcon } from "lucide-react";
import type { ShopListing } from "@/lib/deals/query";
import { dealBadge, savingsLabel } from "@/lib/deals/format";
import { DealImage } from "@/components/deal-image";
import { EditableShopImage } from "@/components/editable-shop-image";
import { SpotlightToggle } from "@/components/spotlight-toggle";
import { cn } from "@/lib/utils";
import {
  DealTypeBadge,
  PriceLevel,
  FeaturedLabel,
  FeaturedRibbon,
  featuredFrame,
} from "@/components/ui/badges";

/** Small "N deals" detail shown beside the shop name. */
function DealCountTag({ count }: { count: number }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-pill bg-line-soft px-2.5 py-1 text-[11px] font-extrabold text-ink-500">
      <TagIcon className="size-3" aria-hidden />
      {count} {count === 1 ? "deal" : "deals"}
    </span>
  );
}

/** Standard shop listing card — the SHOP is the headline; deals are a side detail.
 *  Paid-featured shops get a gold frame + ribbon so they never blend in. */
export function ShopCard({ shop, canEdit = false }: { shop: ShopListing; canEdit?: boolean }) {
  const { business: biz, headline, dealCount, featured } = shop;
  const savings = headline ? savingsLabel(headline) : null;
  const card = (
    <Link
      href={`/b/${biz.slug}`}
      className={cn(
        "group block overflow-hidden bg-surface transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-persimmon-100",
        featured
          ? "rounded-b-[18px]"
          : "rounded-card-lg border border-line-soft shadow-card hover:-translate-y-1 hover:border-persimmon-200 hover:shadow-e2",
      )}
    >
      <div className="relative h-[160px] overflow-hidden">
        {canEdit ? (
          <EditableShopImage businessId={biz.id} src={biz.cover_url} alt={biz.name} />
        ) : (
          <DealImage
            src={biz.cover_url}
            alt={biz.name}
            className="transition-transform duration-500 ease-out group-hover:scale-[1.06]"
          />
        )}
        {/* legibility + depth wash */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900/45 via-ink-900/5 to-transparent" />
        {headline && (
          <span className="absolute left-3 top-3">
            <DealTypeBadge label={dealBadge(headline)} />
          </span>
        )}
        {savings && (
          <span className="absolute right-3 top-3 rounded-pill bg-savings px-2.5 py-1 text-[11px] font-extrabold text-white shadow-e1">
            {savings}
          </span>
        )}
        {/* Shop name reads over the image for a bolder, editorial feel */}
        <h3 className="absolute inset-x-3.5 bottom-2.5 flex items-center gap-1.5 font-display text-[21px] font-extrabold leading-none tracking-tight text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.45)]">
          <span className="truncate">{biz.name}</span>
          {biz.verified && <BadgeCheck className="size-[18px] shrink-0" aria-hidden />}
        </h3>
      </div>
      <div className="flex items-center gap-2 p-3.5 text-xs font-semibold text-muted">
        {biz.cuisine_tags[0] && <span className="text-ink-700">{biz.cuisine_tags[0]}</span>}
        <PriceLevel level={biz.price_level} />
        <span className="ml-auto flex items-center gap-2">
          {canEdit && <SpotlightToggle businessId={biz.id} active={shop.spotlight} />}
          {dealCount > 0 ? (
            <DealCountTag count={dealCount} />
          ) : (
            <span className="inline-flex items-center rounded-pill bg-line-soft px-2.5 py-1 text-[11px] font-extrabold text-muted">
              New shop
            </span>
          )}
        </span>
      </div>
    </Link>
  );

  if (!featured) return card;
  return (
    <div className={cn("rounded-card-lg", featuredFrame)}>
      <FeaturedRibbon className="rounded-t-[15px]" />
      {card}
    </div>
  );
}

/** Large carousel slide — shop name headlines; deals are a small detail line. */
export function ShopHeroCard({ shop }: { shop: ShopListing }) {
  const { business: biz, headline, dealCount, featured } = shop;
  const savings = headline ? savingsLabel(headline) : null;
  return (
    <Link
      href={`/b/${biz.slug}`}
      className="block w-[300px] shrink-0 snap-start overflow-hidden rounded-card-lg border-[1.5px] border-ad-border bg-surface shadow-e3 sm:w-[360px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-persimmon-100"
    >
      <div className="relative h-[190px]">
        <DealImage src={biz.cover_url ?? headline?.image_url ?? null} alt={biz.name} priority />
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
