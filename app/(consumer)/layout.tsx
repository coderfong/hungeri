import { getCurrentProfile } from "@/lib/auth";
import { TopBar } from "@/components/top-bar";
import { BottomNav } from "@/components/bottom-nav";

/**
 * Consumer shell: desktop top bar + mobile bottom nav. Browsing never requires
 * auth, so the user may be null. Pages add their own mobile headers.
 */
export default async function ConsumerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  const user = profile
    ? { display_name: profile.display_name, email: profile.email }
    : null;

  return (
    <div className="min-h-screen">
      <TopBar user={user} />
      <div className="pb-24 md:pb-0">{children}</div>
      <BottomNav />
    </div>
  );
}
