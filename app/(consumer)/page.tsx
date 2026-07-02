import Link from "next/link";
import { Suspense } from "react";
import { Search, MapPin, ChevronDown, Sparkles } from "lucide-react";
import { getFeedShops } from "@/lib/deals/query";
import { getCurrentProfile } from "@/lib/auth";
import { parseFilters, type SearchParams } from "@/lib/deals/filters";
import { ShopCard } from "@/components/shop-card";
import { ShopCarousel } from "@/components/shop-carousel";
import { Logo } from "@/components/logo";
import { featuredBanners, type FeaturedBanner } from "@/config/featured-banners";
import { savingsLabel } from "@/lib/deals/format";
import { FeedSkeleton } from "@/components/feed-skeleton";
import { QuickChips } from "@/components/filters/quick-chips";
import { FilterSheet } from "@/components/filters/filter-sheet";
import { strings } from "@/lib/i18n/strings";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = parseFilters(await searchParams);

  return (
    <main className="mx-auto w-full max-w-6xl">
      {/* Mobile header (desktop uses the shared TopBar) */}
      <div className="px-5 pt-4 md:hidden">
        <div className="flex items-center gap-2.5">
          <Logo size="sm" withWordmark={false} />
          <Link href="/near-me" className="flex items-center gap-1.5 font-extrabold">
            <MapPin className="size-[18px] text-persimmon-500" strokeWidth={2.4} aria-hidden />
            Singapore
            <ChevronDown className="size-4 text-muted" aria-hidden />
          </Link>
          <Suspense>
            <ProfileChip />
          </Suspense>
        </div>
        <div className="mt-3 flex gap-2.5">
          <Link
            href="/search"
            className="flex flex-1 items-center gap-2.5 rounded-[13px] border-[1.5px] border-line bg-surface px-3.5 py-3 text-sm text-muted"
          >
            <Search className="size-[18px]" aria-hidden />
            Shops, cuisines, dishes…
          </Link>
          <FilterSheet basePath="/" filters={filters} />
        </div>
        <div className="mt-3">
          <QuickChips basePath="/" filters={filters} />
        </div>
      </div>

      <div className="hidden items-center gap-3 px-7 pt-6 md:flex">
        <QuickChips basePath="/" filters={filters} />
        <span className="ml-auto">
          <FilterSheet basePath="/" filters={filters} variant="button" />
        </span>
      </div>

      <Suspense fallback={<div className="px-5 pt-4 md:px-7"><FeedSkeleton /></div>}>
        <FeedContent filters={filters} />
      </Suspense>
    </main>
  );
}

async function ProfileChip() {
  const profile = await getCurrentProfile();
  if (!profile) {
    return (
      <Link href="/login" className="ml-auto text-sm font-bold text-persimmon-500">
        Sign in
      </Link>
    );
  }
  return (
    <Link
      href="/account"
      aria-label="Your profile"
      className="ml-auto flex size-[38px] items-center justify-center rounded-full bg-persimmon-200 font-display font-bold text-persimmon-700"
    >
      {(profile.display_name ?? profile.email).charAt(0).toUpperCase()}
    </Link>
  );
}

async function FeedContent({ filters }: { filters: ReturnType<typeof parseFilters> }) {
  const shops = await getFeedShops(filters);

  // Curated featured banners headline the carousel, followed by paid-featured
  // shops (or top-ranked "Top picks" as a fallback so it's never empty).
  const featured = shops.filter((s) => s.featured);
  const picks = featured.length > 0 ? featured : shops.slice(0, 6);
  const pickSlugs = new Set(picks.map((s) => s.business.slug));
  const rest = shops.filter((s) => !pickSlugs.has(s.business.slug));

  const pickBanners: FeaturedBanner[] = picks.map((s) => ({
    slug: s.business.slug,
    name: s.business.name,
    image: s.headline.image_url,
    href: `/b/${s.business.slug}`,
    verified: s.business.verified,
    featured: s.featured,
    deals: s.dealCount,
    cuisine: s.business.cuisine_tags[0] ?? null,
    savings: savingsLabel(s.headline),
  }));
  const carousel: FeaturedBanner[] = [...featuredBanners, ...pickBanners];
  const hasFeatured = carousel.some((b) => b.featured);

  return (
    <div className="pb-8 pt-4">
      {carousel.length > 0 && (
        <section className="mb-5">
          <div className="mb-2.5 flex items-center gap-1.5 px-5 md:px-7">
            <Sparkles className="size-4 text-ad-text" aria-hidden />
            <h2 className="font-display text-base font-bold">
              {hasFeatured ? "Spotlight near you" : "Top picks near you"}
            </h2>
            {hasFeatured && (
              <span className="ml-auto text-[11px] font-bold text-muted">Featured · Ad</span>
            )}
          </div>
          <ShopCarousel banners={carousel} />
        </section>
      )}

      <div className="mb-3 flex items-baseline justify-between px-5 md:px-7">
        <h2 className="font-display text-[17px] font-bold">Shops near you</h2>
        <span className="text-xs font-bold text-muted">{shops.length} shops</span>
      </div>

      {rest.length === 0 ? (
        <p className="mx-5 rounded-card border border-dashed border-line px-4 py-12 text-center text-sm text-ink-500 md:mx-7">
          {shops.length === 0 ? strings.feed.empty : "That's everything nearby for now."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 px-5 sm:grid-cols-2 md:px-7 lg:grid-cols-3">
          {rest.map((shop) => (
            <ShopCard key={shop.business.slug} shop={shop} />
          ))}
        </div>
      )}
    </div>
  );
}
