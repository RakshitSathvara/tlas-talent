-- Row Level Security (BACKEND-ARCHITECTURE.md §3.4, §6). RLS is DEFENSE-IN-DEPTH: the app's
-- Drizzle connection uses a privileged role and BYPASSES these policies — primary authz is the
-- service layer. RLS is the sole guard only on the anon/user-JWT path (browser Realtime), so we
-- enable it everywhere and grant org-scoped SELECT to authenticated users. There are NO write
-- policies: writes go through the service role (which bypasses RLS), so JWT clients cannot write.

-- JWT claim helpers (claims injected by the access token hook / seeded app_metadata).
create or replace function public.current_app_org() returns uuid language sql stable as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'org_id', '')::uuid;
$$;

create or replace function public.current_app_role() returns text language sql stable as $$
  select auth.jwt() -> 'app_metadata' ->> 'role';
$$;

-- organizations: a user may read only their own org.
alter table public.organizations enable row level security;
drop policy if exists org_self_select on public.organizations;
create policy org_self_select on public.organizations
  for select to authenticated using (id = public.current_app_org());

-- Org-scoped SELECT on every business table (notifications handled separately below).
do $$
declare tbl text;
begin
  foreach tbl in array array[
    'users','requisitions','candidates','candidate_stage_history','interviews',
    'interview_panelists','feedback','offers','approval_requests','approval_steps',
    'activities','audit_log','templates','stage_config','approval_chain_config','files'
  ]
  loop
    execute format('alter table public.%I enable row level security;', tbl);
    execute format('drop policy if exists org_select on public.%I;', tbl);
    execute format(
      'create policy org_select on public.%I
         for select to authenticated using (org_id = public.current_app_org());', tbl);
  end loop;
end $$;

-- notifications: recipient-scoped (tighter than org) — the live bell shows only your own.
alter table public.notifications enable row level security;
drop policy if exists notifications_recipient_select on public.notifications;
create policy notifications_recipient_select on public.notifications
  for select to authenticated
  using (
    org_id = public.current_app_org()
    and recipient_id in (select id from public.users where auth_user_id = auth.uid())
  );
