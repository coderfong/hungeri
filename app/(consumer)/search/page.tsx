import Link from "next/link";
import { SearchX } from "lucide-react";
import { getFeedDeals } from "@/lib/deals/query";
import { getSavedDealIds } from "@/lib/deals/saves";
import { getCurrentUser } from "@/lib/auth";
import { StandardDealCard } from "@/components/deal-card";
import { SearchBox } from "@/components/search-box";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Search" };

const POPULAR = ["Bubble tea", "Ramen", "Cafe", "Halal", "1-for-1", "Dessert"];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pt-4">
      <div className="md:hidden">
        <SearchBox initialQuery={query} />
      </div>
      <div className="hidden md:block">
        <SearchBox initialQuery={query} />
      </div>

      {query ? (
        <Results query={query} />
      ) : (
        <section className="mt-6">
          <h2 className="mb-3 text-[13px] font-extrabold uppercase tracking-wide text-muted">
            Popular now
          </h2>
          <div className="flex flex-wrap gap-2">
            {POPULAR.map((term) => (
              <Link
                key={term}
                href={`/search?q=${encodeURIComponent(term)}`}
                className="rounded-pill border-[1.5px] border-line bg-surface px-3.5 py-2 text-[13px] font-semibold hover:border-ink-300"
              >
                {term}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

async function Results({ query }: { query: string }) {
  const [deals, savedIds, user] = await Promise.all([
    getFeedDeals({ q: query, limit: 40 }),
    getSavedDealIds(),
    getCurrentUser(),
  ]);

  if (deals.length === 0) {
    return (
      <div className="flex flex-col items-center pt-10 text-center">
        <div className="mb-5 flex size-24 items-center justify-center rounded-[28px] bg-persimmon-50">
          <SearchX className="size-11 text-persimmon-500" strokeWidth={1.9} aria-hidden />
        </div>
        <h2 className="mb-2 font-display text-[22px] font-extrabold">No deals for that… yet</h2>
        <p className="mb-6 max-w-sm text-sm leading-relaxed text-ink-500">
          Nothing matched “{query}”. Try a broader search, or see what&apos;s hot right now.
        </p>
        <Link href="/">
          <Button size="lg">Browse all deals</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="mb-3 text-[13px] font-bold text-ink-500">
        {deals.length} deal{deals.length > 1 ? "s" : ""} for “{query}”
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {deals.map((deal) => (
          <StandardDealCard
            key={deal.id}
            deal={deal}
            saved={savedIds.has(deal.id)}
            isAuthed={!!user}
          />
        ))}
      </div>
    </div>
  );
}
