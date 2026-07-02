import { createAdminClient } from "@/lib/supabase/admin";
import { CurateForm } from "@/components/admin/curate-form";

export const metadata = { title: "Curate a deal" };

export default async function CuratePage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("businesses")
    .select("id, name")
    .eq("status", "live")
    .order("name", { ascending: true });

  return (
    <div className="mx-auto max-w-2xl px-5 py-6 md:px-8">
      <h1 className="mb-1 font-display text-2xl font-extrabold">Curate a deal</h1>
      <p className="mb-6 text-sm text-ink-500">
        Manually enter a deal (source = curated) and tag attribution. It goes live immediately
        and is clearly sourced.
      </p>
      <CurateForm businesses={data ?? []} />
    </div>
  );
}
