import { requireBusiness } from "@/lib/merchant/context";
import { BusinessSettingsForm } from "@/components/merchant/business-settings-form";

export const metadata = { title: "Business settings" };

export default async function SettingsPage() {
  const { business } = await requireBusiness();
  return (
    <div className="mx-auto max-w-2xl px-5 py-6 md:px-8">
      <h1 className="mb-1 font-display text-2xl font-extrabold">Business settings</h1>
      <p className="mb-6 text-sm text-ink-500">This is what diners see on your profile.</p>
      <BusinessSettingsForm business={business} />
    </div>
  );
}
