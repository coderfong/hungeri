import Link from "next/link";
import { cn } from "@/lib/utils";
import type { FeedDeal } from "@/lib/deals/query";
import {
  dealBadge,
  savingsLabel,
  isNewToday,
  shouldCountdown,
} from "@/lib/deals/format";
import { DealImage } from "@/components/deal-image";
import { SaveButton } from "@/components/save-button";
import { Countdown } from "@/components/countdown";
import {
  DealTypeBadge,
  SavingsBadge,
  NewTodayBadge,
  PriceLevel,
  FeaturedLabel,
  FeaturedRibbon,
  featuredFrame,
  Tag,
} from "@/components/ui/badges";

function BusinessAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-[8px] bg-ink-900 font-display font-extrabold text-white",
        className,
      )}
      aria-hidden
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

type CardProps = {
  deal: FeedDeal;
  saved: boolean;
  isAuthed: boolean;
};

/** A · Standard feed card. Paid-featured deals get a gold frame + ribbon. */
export function StandardDealCard({ deal, saved, isAuthed }: CardProps) {
  const biz = deal.businesses;
  const savings = savingsLabel(deal);
  const card = (
    <Link
      href={`/deals/${deal.id}`}
      className={cn(
        "block overflow-hidden bg-surface transition-shadow focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-persimmon-100",
        deal.featured
          ? "rounded-b-[18px]"
          : "rounded-card-lg border border-line-soft shadow-card hover:shadow-e2",
      )}
    >
      <div className="relative h-[158px]">
        <DealImage src={deal.image_url} alt={deal.title} />
        <span className="absolute left-3 top-3">
          <DealTypeBadge label={dealBadge(deal)} />
        </span>
        <span className="absolute right-3 top-3">
          <SaveButton dealId={deal.id} initialSaved={saved} isAuthed={isAuthed} />
        </span>
        {shouldCountdown(deal.end_at) && (
          <span className="absolute bottom-3 left-3 rounded-[8px] bg-urgent px-2.5 py-1.5 text-white">
            <Countdown endAt={deal.end_at} className="text-white" />
          </span>
        )}
        {isNewToday(deal.created_at) && !shouldCountdown(deal.end_at) && (
          <span className="absolute bottom-3 left-3">
            <NewTodayBadge />
          </span>
        )}
      </div>
      <div className="p-[15px]">
        <div className="mb-2 flex items-center gap-2.5">
          <BusinessAvatar name={biz?.name ?? "?"} className="size-7 text-xs" />
          <span className="truncate text-[13px] font-bold">{biz?.name}</span>
        </div>
        <h3 className="mb-1.5 font-display text-[22px] font-extrabold leading-[1.05] tracking-tight">
          {deal.title}
        </h3>
        {deal.description && (
          <p className="mb-3 line-clamp-2 text-[13px] leading-snug text-ink-500">
            {deal.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {savings && <SavingsBadge>{savings}</SavingsBadge>}
          <PriceLevel level={biz?.price_level ?? null} />
          {biz?.cuisine_tags[0] && (
            <span className="ml-auto">
              <Tag>{biz.cuisine_tags[0]}</Tag>
            </span>
          )}
        </div>
      </div>
    </Link>
  );

  if (!deal.featured) return card;
  return (
    <div className={cn("rounded-card-lg", featuredFrame)}>
      <FeaturedRibbon className="rounded-t-[15px]" />
      {card}
    </div>
  );
}

/** B · Compact list card. */
export function CompactDealCard({ deal, saved, isAuthed }: CardProps) {
  const biz = deal.businesses;
  const savings = savingsLabel(deal);
  return (
    <Link
      href={`/deals/${deal.id}`}
      className="flex overflow-hidden rounded-card border border-line-soft bg-surface shadow-e1 transition-shadow hover:shadow-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-persimmon-100"
    >
      <div className="relative w-[104px] shrink-0">
        <DealImage src={deal.image_url} alt={deal.title} sizes="104px" />
        <span className="absolute bottom-2 left-2">
          <DealTypeBadge label={dealBadge(deal)} className="px-2 py-1 text-[10px]" />
        </span>
      </div>
      <div className="min-w-0 flex-1 p-[13px_14px]">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13px] font-bold">{biz?.name}</span>
          <span className="ml-auto shrink-0">
            <SaveButton dealId={deal.id} initialSaved={saved} isAuthed={isAuthed} size="sm" />
          </span>
        </div>
        <h3 className="my-1 font-display text-[17px] font-bold leading-tight tracking-tight">
          {deal.title}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {savings && (
            <span className="text-[12px] font-extrabold text-savings">{savings}</span>
          )}
          {shouldCountdown(deal.end_at) && (
            <Countdown endAt={deal.end_at} withIcon={false} prefix="· " />
          )}
        </div>
      </div>
    </Link>
  );
}

/** C · Featured / Spotlight hero (paid). Always carries the gold "Featured · Ad" label. */
export function SpotlightHero({ deal, saved, isAuthed }: CardProps) {
  const biz = deal.businesses;
  return (
    <Link
      href={`/deals/${deal.id}`}
      className="block overflow-hidden rounded-card border-[1.5px] border-ad-border bg-surface shadow-e3 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-persimmon-100"
    >
      <div className="relative h-[148px] sm:h-[170px]">
        <DealImage src={deal.image_url} alt={deal.title} priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        <span className="absolute left-3 top-3">
          <FeaturedLabel short />
        </span>
        <span className="absolute right-3 top-3">
          <SaveButton dealId={deal.id} initialSaved={saved} isAuthed={isAuthed} />
        </span>
        <div className="absolute inset-x-4 bottom-3 text-white">
          <div className="font-display text-[21px] font-extrabold leading-none sm:text-[24px]">
            {deal.title}
          </div>
          <div className="mt-1 text-[12px] font-semibold opacity-95">{biz?.name}</div>
        </div>
      </div>
    </Link>
  );
}
