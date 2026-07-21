import { requireBusiness } from "@/lib/merchant/context";
import { DealForm } from "@/components/merchant/deal-form";

export const metadata = { title: "Create deal" };

export default async function NewDealPage() {
  const { business } = await requireBusiness();
  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + 7 * 86_400_000);

  return (
    <DealForm
      businessId={business.id}
      businessName={business.name}
      initial={{ start_iso: startsAt.toISOString(), end_iso: endsAt.toISOString() }}
    />
  );
}
