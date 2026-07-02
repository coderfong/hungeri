import { getMerchantContext, listAllBusinesses } from "@/lib/merchant/context";
import { MerchantSidebar } from "@/components/merchant/sidebar";

/**
 * Merchant dashboard shell. Auth is required (getMerchantContext redirects);
 * a business is NOT required here so the onboarding flow can render with none.
 * A super merchant also gets a business switcher (any business).
 */
export default async function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { business, isSuper } = await getMerchantContext();
  const businesses = isSuper ? await listAllBusinesses() : [];

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <MerchantSidebar
        business={
          business
            ? { name: business.name, verified: business.verified, status: business.status }
            : null
        }
        isSuper={isSuper}
        businesses={businesses}
        activeBusinessId={business?.id ?? null}
      />
      <main className="min-w-0 flex-1 bg-bg">{children}</main>
    </div>
  );
}
