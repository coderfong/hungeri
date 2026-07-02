import { requireBusiness } from "@/lib/merchant/context";
import { DealForm } from "@/components/merchant/deal-form";

export const metadata = { title: "Create deal" };

export default async function NewDealPage() {
  const { business } = await requireBusiness();
  return <DealForm businessId={business.id} businessName={business.name} />;
}
