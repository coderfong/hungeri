import { redirect } from "next/navigation";
import { getMerchantContext } from "@/lib/merchant/context";
import { OnboardingWizard } from "@/components/merchant/onboarding-wizard";

export const metadata = { title: "Set up your business" };

export default async function OnboardingPage() {
  const { business } = await getMerchantContext();
  if (business) redirect("/dashboard");
  return <OnboardingWizard />;
}
