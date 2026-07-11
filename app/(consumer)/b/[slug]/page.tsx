import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Star, BadgeCheck, Navigation } from "lucide-react";
import { getBusinessBySlug } from "@/lib/business/query";
import { getSavedDealIds } from "@/lib/deals/saves";
import { getCurrentUser } from "@/lib/auth";
import { DealImage } from "@/components/deal-image";
import { CompactDealCard } from "@/components/deal-card";
import { PriceLevel } from "@/components/ui/badges";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const biz = await getBusinessBySlug(slug);
  if (!biz) return { title: "Business not found" };
  return {
    title: biz.name,
    description: biz.description ?? `${biz.name} deals on Hungeri.`,
    openGraph: {
      title: biz.name,
      description: biz.description ?? undefined,
      images: biz.cover_url ? [{ url: biz.cover_url }] : undefined,
    },
  };
}

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [biz, savedIds, user] = await Promise.all([
    getBusinessBySlug(slug),
    getSavedDealIds(),
    getCurrentUser(),
  ]);
  if (!biz) notFound();
  const isAuthed = !!user;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: biz.name,
    description: biz.description ?? undefined,
    servesCuisine: biz.cuisine_tags,
    address: biz.locations[0]
      ? {
          "@type": "PostalAddress",
          streetAddress: biz.locations[0].address ?? undefined,
          postalCode: biz.locations[0].postal_code ?? undefined,
          addressCountry: "SG",
        }
      : undefined,
  };

  return (
    <main className="mx-auto w-full max-w-3xl pb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Cover */}
      <div className="relative h-[150px] md:rounded-b-3xl md:overflow-hidden">
        <DealImage src={biz.cover_url} alt={`${biz.name} cover`} priority />
        <Link
          href="/"
          aria-label="Back"
          className="absolute left-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/90 shadow-e1 backdrop-blur"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
      </div>

      <div className="px-5">
        {/* Only the avatar overlaps the cover; the name stays below it so long
            names never climb into the image. */}
        <div className="mb-3.5 flex items-end gap-3">
          <div className="relative -mt-9 flex size-[72px] shrink-0 items-center justify-center overflow-hidden rounded-[20px] border-4 border-bg bg-ink-900 font-display text-[28px] font-extrabold text-white">
            {biz.logo_url ? (
              <DealImage src={biz.logo_url} alt={`${biz.name} logo`} sizes="72px" />
            ) : (
              biz.name.charAt(0)
            )}
          </div>
          <div className="mb-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-display text-[22px] font-extrabold leading-tight">{biz.name}</h1>
              {biz.verified && (
                <BadgeCheck className="size-[18px] shrink-0 text-persimmon-500" aria-hidden />
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
              <Star className="size-3 text-star" fill="currentColor" aria-hidden />
              4.6 · {biz.cuisine_tags[0] ?? "F&B"} · <PriceLevel level={biz.price_level} />
            </div>
          </div>
        </div>

        {biz.description && (
          <p className="mb-4 text-[13.5px] leading-relaxed text-ink-500">
            {biz.description}
          </p>
        )}

        {biz.locations.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-2 font-display text-[17px] font-bold">
              Outlet{biz.locations.length > 1 ? "s" : ""}
            </h2>
            <div className="space-y-2">
              {biz.locations.map((loc) => (
                <div
                  key={loc.id}
                  className="flex items-center gap-3 rounded-card border border-line-soft bg-surface p-3"
                >
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-persimmon-50">
                    <DealImage src={loc.photo_url} alt={loc.address ?? "Outlet"} sizes="48px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{loc.address ?? "Outlet"}</div>
                    {loc.postal_code && (
                      <div className="text-xs text-muted">S{loc.postal_code}</div>
                    )}
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-btn border-[1.5px] border-line bg-surface px-3 py-2 text-xs font-bold hover:border-ink-300"
                  >
                    <Navigation className="size-3.5" aria-hidden />
                    Directions
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-display text-[17px] font-bold">Live deals</h2>
          <span className="rounded-full bg-persimmon-500 px-2 py-0.5 text-xs font-extrabold text-white">
            {biz.deals.length}
          </span>
        </div>

        {biz.deals.length === 0 ? (
          <p className="rounded-card border border-dashed border-line px-4 py-8 text-center text-sm text-ink-500">
            No live deals right now — check back soon.
          </p>
        ) : (
          <div className="space-y-3">
            {biz.deals.map((deal) => (
              <CompactDealCard
                key={deal.id}
                deal={deal}
                saved={savedIds.has(deal.id)}
                isAuthed={isAuthed}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
