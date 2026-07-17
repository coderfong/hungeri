import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Star, Navigation, BadgeCheck, ClockAlert } from "lucide-react";
import { getDealDetail } from "@/lib/deals/detail";
import { dealBadge, savingsLabel, isExpired } from "@/lib/deals/format";
import { channelLabel } from "@/lib/deals/format";
import { formatDateTime } from "@/lib/i18n/config";
import { DealImage } from "@/components/deal-image";
import { SaveButton } from "@/components/save-button";
import { ShareButton } from "@/components/share-button";
import { ReportButton } from "@/components/report-button";
import { RedeemFlow } from "@/components/redeem-flow";
import { ViewTracker } from "@/components/view-tracker";
import { Countdown } from "@/components/countdown";
import { Button } from "@/components/ui/button";
import {
  SavingsBadge,
  PriceLevel,
  Tag,
  FeaturedLabel,
} from "@/components/ui/badges";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const deal = await getDealDetail(id);
  if (!deal) return { title: "Deal not found" };
  const desc =
    deal.description ?? `${deal.business?.name ?? "A spot"} on Hungeri.`;
  return {
    title: deal.title,
    description: desc,
    openGraph: {
      title: deal.title,
      description: desc,
      images: deal.image_url ? [{ url: deal.image_url }] : undefined,
      type: "website",
    },
  };
}

function mapsHref(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deal = await getDealDetail(id);
  if (!deal) notFound();

  const biz = deal.business;
  const ended = isExpired(deal.end_at) || deal.status === "expired";
  const savings = savingsLabel(deal);

  // Schema.org Offer for SEO/rich results.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Offer",
    name: deal.title,
    description: deal.description ?? undefined,
    priceCurrency: "SGD",
    availabilityStarts: deal.start_at,
    availabilityEnds: deal.end_at,
    url: `/deals/${deal.id}`,
    seller: biz
      ? { "@type": "Restaurant", name: biz.name, servesCuisine: biz.cuisine_tags }
      : undefined,
  };

  return (
    <main className="mx-auto w-full max-w-3xl pb-28 md:pb-12">
      <ViewTracker dealId={deal.id} source="feed" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <div className="relative h-[260px] md:rounded-b-3xl md:overflow-hidden">
        <DealImage src={deal.image_url} alt={deal.title} priority />
        {ended && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-900/45">
            <span className="-rotate-6 rounded-[14px] border-2 border-white px-5 py-2.5 font-display text-2xl font-extrabold text-white">
              DEAL ENDED
            </span>
          </div>
        )}
        <div className="absolute inset-x-4 top-4 flex justify-between">
          <Link
            href="/"
            aria-label="Back to feed"
            className="flex size-10 items-center justify-center rounded-full bg-white/90 shadow-e1 backdrop-blur"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </Link>
          <div className="flex gap-2.5">
            <ShareButton
              title={deal.title}
              className="size-10 rounded-full bg-white/90 text-ink-700 shadow-e1 backdrop-blur"
            />
            <SaveButton
              dealId={deal.id}
              initialSaved={deal.saved}
              isAuthed={deal.isAuthed}
              size="lg"
            />
          </div>
        </div>
        {!ended && (
          <span className="absolute bottom-3.5 left-4 inline-flex items-center rounded-[10px] bg-urgent px-3 py-2 text-white">
            <Countdown endAt={deal.end_at} className="text-[13px] text-white" prefix="Ends in " />
          </span>
        )}
        {deal.featured && !ended && (
          <span className="absolute bottom-3.5 right-4">
            <FeaturedLabel />
          </span>
        )}
      </div>

      <div className="px-5 pt-5 md:px-0">
        {/* Business */}
        {biz && (
          <Link href={`/b/${biz.slug}`} className="mb-3.5 flex items-center gap-3">
            <span className="flex size-[42px] items-center justify-center rounded-xl bg-ink-900 font-display text-base font-extrabold text-white">
              {biz.name.charAt(0)}
            </span>
            <span>
              <span className="flex items-center gap-1.5 font-extrabold">
                {biz.name}
                {biz.verified && (
                  <BadgeCheck className="size-[18px] text-persimmon-500" aria-hidden />
                )}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <Star className="size-3 text-star" fill="currentColor" aria-hidden />
                4.6 · {biz.cuisine_tags[0] ?? "F&B"} · <PriceLevel level={biz.price_level} />
              </span>
            </span>
          </Link>
        )}

        <h1 className="mb-2.5 font-display text-3xl font-extrabold leading-[1.02] tracking-tight">
          {deal.title}
        </h1>

        <div className="mb-5 flex flex-wrap gap-2">
          {savings ? <SavingsBadge>{savings}</SavingsBadge> : <SavingsBadge>{dealBadge(deal)}</SavingsBadge>}
          {deal.dietary_tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
          {deal.channels.map((c) => (
            <Tag key={c}>{channelLabel(c)}</Tag>
          ))}
        </div>

        {ended ? (
          <EndedCard businessSlug={biz?.slug} />
        ) : (
          <RedemptionPanel deal={deal} />
        )}

        {/* Terms */}
        {(deal.terms || deal.fine_print) && (
          <>
            <h2 className="mb-2 mt-6 font-display text-[17px] font-bold">
              Terms &amp; fine print
            </h2>
            <ul className="mb-5 list-disc space-y-1 pl-5 text-[13.5px] leading-relaxed text-ink-500">
              {deal.terms && <li>{deal.terms}</li>}
              {deal.fine_print && <li>{deal.fine_print}</li>}
              <li>Valid until {formatDateTime(deal.end_at, { dateStyle: "medium" })}</li>
            </ul>
          </>
        )}

        {/* Outlets */}
        {deal.locations.length > 0 && (
          <>
            <h2 className="mb-2.5 mt-6 font-display text-[17px] font-bold">
              Outlets · {deal.locations.length}
            </h2>
            <div className="space-y-3">
              {deal.locations.map((loc) => (
                <div
                  key={loc.id}
                  className="flex items-center gap-3 rounded-card border border-line-soft bg-surface p-3.5"
                >
                  <div>
                    <div className="text-sm font-bold">{loc.address ?? biz?.name}</div>
                    <div className="text-xs text-muted">
                      {[loc.postal_code, loc.city].filter(Boolean).join(", ")}
                    </div>
                  </div>
                  <a
                    href={mapsHref(loc.lat, loc.lng)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto inline-flex items-center gap-1.5 text-[13px] font-bold text-persimmon-500"
                  >
                    <Navigation className="size-[15px]" aria-hidden />
                    Directions
                  </a>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">Map view arrives with “Near me”.</p>
          </>
        )}

        <div className="mt-4 flex justify-center">
          <ReportButton dealId={deal.id} />
        </div>
      </div>

      {/* Sticky CTA (mobile, live only) */}
      {!ended && (
        <div className="fixed inset-x-0 bottom-[68px] z-30 flex items-center gap-3 border-t border-line-soft bg-surface px-5 py-3.5 md:hidden">
          {savings && (
            <div>
              <div className="text-[11px] font-bold text-muted">Offer</div>
              <div className="font-display text-xl font-extrabold text-savings">
                {savings}
              </div>
            </div>
          )}
          <div className="flex-1">
            <RedeemFlow dealId={deal.id} />
          </div>
        </div>
      )}
    </main>
  );
}

function RedemptionPanel({ deal }: { deal: Awaited<ReturnType<typeof getDealDetail>> }) {
  if (!deal) return null;
  return (
    <div className="rounded-card bg-ink-900 p-[18px] text-white">
      <div className="mb-2.5 text-xs font-bold uppercase tracking-wider text-persimmon-300">
        How to redeem
      </div>
      <p className="mb-3 text-sm text-line">
        Scan the shop QR in-store, then show the “Redeemed!” screen to staff.
      </p>
      {/* On desktop the redeem control lives here; on mobile it's the sticky CTA. */}
      <div className="hidden md:block">
        <RedeemFlow dealId={deal.id} />
      </div>
    </div>
  );
}

function EndedCard({ businessSlug }: { businessSlug?: string }) {
  return (
    <div className="rounded-card border border-line-soft bg-surface p-[18px] text-center">
      <div className="mx-auto mb-3 flex size-[52px] items-center justify-center rounded-[14px] bg-line-soft">
        <ClockAlert className="size-[26px] text-muted" aria-hidden />
      </div>
      <div className="mb-1 font-extrabold">This deal has ended</div>
      <p className="mx-auto mb-4 max-w-sm text-[13px] leading-relaxed text-ink-500">
        But this spot runs deals often — follow it and we&apos;ll ping you when the next one drops.
      </p>
      <div className="flex flex-col gap-2.5">
        {businessSlug && (
          <Link href={`/b/${businessSlug}`}>
            <Button className="w-full">See this brand&apos;s page</Button>
          </Link>
        )}
        <Link href="/">
          <Button variant="secondary" className="w-full">
            See similar deals nearby
          </Button>
        </Link>
      </div>
    </div>
  );
}
