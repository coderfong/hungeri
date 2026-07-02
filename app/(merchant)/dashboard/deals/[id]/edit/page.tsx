import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireBusiness } from "@/lib/merchant/context";
import { DealForm } from "@/components/merchant/deal-form";
import type { DealChannel, RedemptionMethod } from "@/types/database";

export const metadata = { title: "Edit deal" };

export default async function EditDealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { business } = await requireBusiness();
  const supabase = await createClient();

  const { data: deal } = await supabase
    .from("deals")
    .select("*")
    .eq("id", id)
    .eq("business_id", business.id) // defence-in-depth alongside RLS
    .maybeSingle();
  if (!deal) notFound();

  return (
    <DealForm
      businessId={business.id}
      businessName={business.name}
      dealId={deal.id}
      initial={{
        title: deal.title,
        description: deal.description ?? "",
        deal_type: deal.deal_type,
        discount_value: deal.discount_value != null ? String(deal.discount_value) : "",
        channels: (deal.channels ?? []) as DealChannel[],
        dietary_tags: deal.dietary_tags ?? [],
        recurring: !!deal.recurring_rule,
        redemption_method: deal.redemption_method as RedemptionMethod,
        redemption_code: deal.redemption_code ?? "",
        redemption_url: deal.redemption_url ?? "",
        image_url: deal.image_url ?? "",
        terms: deal.terms ?? "",
        fine_print: deal.fine_print ?? "",
        start_iso: deal.start_at,
        end_iso: deal.end_at,
      }}
    />
  );
}
