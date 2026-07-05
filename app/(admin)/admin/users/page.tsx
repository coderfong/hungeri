import { ArrowUpCircle } from "lucide-react";
import { requireAdmin } from "@/lib/admin/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { upgradeToMerchant } from "@/lib/admin/users";
import { RoleAvatar } from "@/components/role-avatar";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/types/database";

export const metadata = { title: "Users" };

function joined(date: string) {
  return new Date(date).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminUsersPage() {
  await requireAdmin();
  const { data } = await createAdminClient()
    .from("users")
    .select("id, display_name, email, role, created_at")
    .order("created_at", { ascending: false })
    .limit(300);

  const users = data ?? [];
  const consumers = users.filter((u) => u.role === "consumer");
  const staff = users.filter((u) => u.role !== "consumer");

  return (
    <div className="px-5 py-6 md:px-8">
      <h1 className="font-display text-2xl font-extrabold">Users</h1>
      <p className="mt-0.5 max-w-xl text-sm text-ink-500">
        Promote a consumer to a merchant so they can open a dashboard and post deals. Merchants
        start with no business and are taken to onboarding on first sign-in.
      </p>

      <section className="mt-6">
        <h2 className="mb-3 text-[13px] font-extrabold uppercase tracking-wide text-muted">
          Consumers · {consumers.length}
        </h2>
        {consumers.length === 0 ? (
          <p className="rounded-card border border-dashed border-line px-4 py-8 text-center text-sm text-ink-500">
            No consumer accounts yet.
          </p>
        ) : (
          <div className="overflow-hidden rounded-card border border-line-soft bg-surface">
            {consumers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 border-b border-line-soft px-4 py-3 last:border-0">
                <RoleAvatar role="consumer" size={40} className="size-10 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold">{u.display_name || "Unnamed"}</div>
                  <div className="text-xs text-muted">joined {joined(u.created_at)}</div>
                </div>
                <form action={upgradeToMerchant}>
                  <input type="hidden" name="userId" value={u.id} />
                  <Button size="sm" type="submit">
                    <ArrowUpCircle className="size-4" aria-hidden /> Make merchant
                  </Button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-[13px] font-extrabold uppercase tracking-wide text-muted">
          Merchants &amp; admins · {staff.length}
        </h2>
        <div className="overflow-hidden rounded-card border border-line-soft bg-surface">
          {staff.map((u) => (
            <div key={u.id} className="flex items-center gap-3 border-b border-line-soft px-4 py-3 last:border-0">
              <RoleAvatar role={u.role as UserRole} size={40} className="size-10 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">{u.display_name || "Unnamed"}</div>
                <div className="text-xs text-muted">joined {joined(u.created_at)}</div>
              </div>
              <span className="rounded-full bg-line-soft px-2.5 py-0.5 text-xs font-bold capitalize text-ink-500">
                {u.role}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
