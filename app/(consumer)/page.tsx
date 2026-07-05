import Link from "next/link";
import { Suspense } from "react";
import { MapPin, ChevronDown, Sparkles } from "lucide-react";
import { getFeedShops } from "@/lib/deals/query";
import { getCurrentProfile } from "@/lib/auth";
import { isSuperMerchant } from "@/config/role-phones";
import { parseFilters, type SearchParams } from "@/lib/deals/filters";
import { ShopCard } from "@/components/shop-card";
import { ShopCarousel } from "@/components/shop-carousel";
import { Logo } from "@/components/logo";
import { RoleAvatar } from "@/components/role-avatar";
import { SearchBox } from "@/components/search-box";
import { type FeaturedBanner } from "@/config/featured-banners";
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
      <header className="relative overflow-hidden md:hidden">
        <span
          aria-hidden
          className="animate-drift pointer-events-none absolute -right-10 -top-12 size-44 rounded-full bg-persimmon-300/25 blur-3xl"
        />
        <div className="hero-mesh relative rounded-b-[26px] px-5 pb-4 pt-4 shadow-[0_10px_30px_-18px_rgba(255,90,31,0.5)]">
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
          <h1 className="mt-3.5 font-display text-[25px] font-extrabold leading-[1.08] tracking-tight">
            Great food, <span className="text-gradient-persimmon">unbeatable deals</span>
          </h1>
          <p className="mt-1 text-[13px] font-semibold text-ink-500">
            Fresh drops near you — grab them before they&apos;re gone.
          </p>
          <div className="mt-3.5 flex gap-2.5">
            <SearchBox variant="bar" />
            <FilterSheet basePath="/" filters={filters} />
          </div>
        </div>
        <div className="px-5 pb-1 pt-3">
          <QuickChips basePath="/" filters={filters} />
        </div>
      </header>

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
    <Link href="/account" aria-label="Your profile" className="ml-auto shrink-0">
      <RoleAvatar role={profile.role} size={38} className="size-[38px]" />
    </Link>
  );
}

async function FeedContent({ filters }: { filters: ReturnType<typeof parseFilters> }) {
  const [shops, profile] = await Promise.all([getFeedShops(filters), getCurrentProfile()]);
  // Admins and super-merchants can set any shop's cover image inline.
  const canEdit = !!profile && (profile.role === "admin" || isSuperMerchant(profile.email));

  // Carousel = admin/super curated spotlight shops + paid-featured shops, else
  // the top-ranked "Top picks". Every slide is a real business linking to its
  // own /b/[slug] page (searchable, cover editable inline).
  const curated = shops.filter((s) => s.spotlight || s.featured);
  const picks = curated.length > 0 ? curated : shops.filter((s) => s.headline).slice(0, 6);
  const pickSlugs = new Set(picks.map((s) => s.business.slug));
  const rest = shops.filter((s) => !pickSlugs.has(s.business.slug));

  const carousel: FeaturedBanner[] = picks.map((s) => ({
    businessId: s.business.id,
    slug: s.business.slug,
    name: s.business.name,
    image: s.business.cover_url ?? s.headline?.image_url ?? null,
    href: `/b/${s.business.slug}`,
    verified: s.business.verified,
    featured: s.featured,
    spotlight: s.spotlight,
    deals: s.dealCount,
    cuisine: s.business.cuisine_tags[0] ?? null,
    savings: s.headline ? savingsLabel(s.headline) : null,
  }));
  const hasFeatured = carousel.some((b) => b.featured);
  const hasCurated = curated.length > 0;

  return (
    <div className="pb-8 pt-4">
      {carousel.length > 0 && (
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2 px-5 md:px-7">
            <span className="flex size-6 items-center justify-center rounded-lg bg-ad-bg">
              <Sparkles className="size-3.5 text-ad-text" aria-hidden />
            </span>
            <h2 className="font-display text-lg font-extrabold tracking-tight">
              {hasCurated ? "Spotlight near you" : "Top picks near you"}
            </h2>
            {hasFeatured && (
              <span className="ml-auto rounded-pill bg-ad-bg px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-ad-text">
                Featured · Ad
              </span>
            )}
          </div>
          <ShopCarousel banners={carousel} canEdit={canEdit} />
        </section>
      )}

      <div className="mb-3.5 flex items-center gap-2.5 px-5 md:px-7">
        <span
          aria-hidden
          className="h-6 w-1.5 rounded-full bg-gradient-to-b from-persimmon-400 to-persimmon-600"
        />
        <h2 className="font-display text-xl font-extrabold tracking-tight">Shops near you</h2>
        <span className="ml-auto rounded-pill bg-line-soft px-2.5 py-1 text-[11px] font-extrabold text-ink-500">
          {shops.length} shops
        </span>
      </div>

      {rest.length === 0 ? (
        <p className="mx-5 rounded-card border border-dashed border-line px-4 py-12 text-center text-sm text-ink-500 md:mx-7">
          {shops.length === 0 ? strings.feed.empty : "That's everything nearby for now."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 px-5 sm:grid-cols-2 md:px-7 lg:grid-cols-3">
          {rest.map((shop, i) => (
            <div
              key={shop.business.slug}
              className="animate-rise"
              style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
            >
              <ShopCard shop={shop} canEdit={canEdit} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
