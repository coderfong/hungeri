import { requireAdmin } from "@/lib/admin/context";
import { getAdminCounts } from "@/lib/admin/stats";
import { AdminSidebar } from "@/components/admin/sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const counts = await getAdminCounts();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AdminSidebar counts={{ pending: counts.pending, reports: counts.reports }} />
      <main className="min-w-0 flex-1 bg-bg">{children}</main>
    </div>
  );
}
