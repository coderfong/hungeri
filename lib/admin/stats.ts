import { createAdminClient } from "@/lib/supabase/admin";

/** Sidebar/overview counts. Service-role (admin-only surface). */
export async function getAdminCounts() {
  const admin = createAdminClient();
  const count = async (
    table: "deals" | "reports" | "businesses",
    col: string,
    val: string,
  ) => {
    const { count } = await admin
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq(col, val);
    return count ?? 0;
  };

  const [pending, reports, liveDeals, liveBiz] = await Promise.all([
    count("deals", "status", "pending_review"),
    count("reports", "status", "open"),
    count("deals", "status", "live"),
    count("businesses", "status", "live"),
  ]);

  return { pending, reports, liveDeals, liveBiz };
}
