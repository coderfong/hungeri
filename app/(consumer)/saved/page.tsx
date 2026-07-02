import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart, Clock, UtensilsCrossed } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import type { FeedDeal } from "@/lib/deals/query";
import { isEndingSoon } from "@/lib/deals/format";
import { CompactDealCard } from "@/components/deal-card";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Saved deals" };

const SAVED_SELECT =
  "deal_id, deals(id, title, description, deal_type, discount_value, image_url, channels, dietary_tags, start_at, end_at, created_at, businesses(name, slug, price_level, cuisine_tags, logo_url, verified))";

export default async function SavedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/saved");

  const supabase = await createClient();
  const { data } = await supabase
    .from("saves")
    .select(SAVED_SELECT)
    .eq("consumer_id", user.id)
    .order("created_at", { ascending: false });

  const deals: FeedDeal[] = (data ?? [])
    .map((row) => {
      const r = row as unknown as { deals: Record<string, unknown> | null };
      const d = r.deals;
      if (!d) return null;
      const biz = Array.isArray(d.businesses) ? d.businesses[0] : d.businesses;
      return {
        ...(d as unknown as FeedDeal),
        businesses: biz,
        featured: false,
        placementTier: null,
        geoScope: null,
      } as FeedDeal;
    })
    .filter((d): d is FeedDeal => d !== null);

  const expiring = deals.filter((d) => isEndingSoon(d.end_at));
  const all = deals.filter((d) => !isEndingSoon(d.end_at));

  if (deals.length === 0) {
    return (
      <main className="mx-auto w-full max-w-3xl px-5 pt-4">
        <h1 className="font-display text-[26px] font-extrabold">Saved deals</h1>
        <div className="flex flex-col items-center pt-16 text-center">
          <div className="mb-5 flex size-24 items-center justify-center rounded-[28px] bg-persimmon-50">
            <Heart className="size-11 text-persimmon-500" aria-hidden />
          </div>
          <h2 className="mb-2 font-display text-[23px] font-extrabold">No saved deals yet</h2>
          <p className="mb-6 max-w-sm text-sm leading-relaxed text-ink-500">
            Tap the heart on any deal and it&apos;ll wait for you here — perfect for planning your next bite.
          </p>
          <Link href="/">
            <Button size="lg">
              <UtensilsCrossed className="size-[18px]" aria-hidden />
              Explore deals
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pt-4">
      <h1 className="mb-4 font-display text-[26px] font-extrabold">Saved deals</h1>

      {expiring.length > 0 && (
        <section className="mb-6">
          <div className="mb-2.5 flex items-center gap-1.5">
            <Clock className="size-4 text-urgent" aria-hidden />
            <h2 className="text-sm font-extrabold text-urgent">Expiring soon</h2>
          </div>
          <div className="space-y-3">
            {expiring.map((deal) => (
              <CompactDealCard key={deal.id} deal={deal} saved isAuthed />
            ))}
          </div>
        </section>
      )}

      <h2 className="mb-2.5 text-sm font-extrabold">All saved · {deals.length}</h2>
      <div className="space-y-3">
        {all.map((deal) => (
          <CompactDealCard key={deal.id} deal={deal} saved isAuthed />
        ))}
      </div>
    </main>
  );
}
