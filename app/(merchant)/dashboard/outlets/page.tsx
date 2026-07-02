import { requireBusiness } from "@/lib/merchant/context";
import { OutletsManager } from "@/components/merchant/outlets-manager";
import type { LocationRow } from "@/types/database";

export const metadata = { title: "Outlets" };

export default async function OutletsPage() {
  const { business, db: supabase } = await requireBusiness();
  const { data } = await supabase
    .from("locations")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto max-w-2xl px-5 py-6 md:px-8">
      <h1 className="mb-1 font-display text-2xl font-extrabold">Outlets</h1>
      <p className="mb-6 text-sm text-ink-500">
        Where diners can redeem your deals. Each outlet shows on the map and powers “near me”.
      </p>
      <OutletsManager outlets={(data ?? []) as LocationRow[]} />
    </div>
  );
}
