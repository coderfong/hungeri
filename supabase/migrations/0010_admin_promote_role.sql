-- 0010_admin_promote_role.sql
-- Let admins change another user's role from the app.
--
-- Direct UPDATEs can't do this: the `users_update_self` RLS policy only allows a
-- user to update their own row, and even with the service-role key the
-- `prevent_role_escalation` trigger blocks role changes because is_admin() reads
-- auth.uid(), which the service role doesn't set.
--
-- This SECURITY DEFINER function is called with the admin's own session, so
-- is_admin() is true both here and inside the trigger. It bypasses the
-- per-row RLS while still enforcing the admin check itself.

create or replace function public.set_user_role(target uuid, new_role user_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins may change a user role' using errcode = 'insufficient_privilege';
  end if;
  update public.users set role = new_role where id = target;
end;
$$;

revoke all on function public.set_user_role(uuid, user_role) from public, anon;
grant execute on function public.set_user_role(uuid, user_role) to authenticated;
