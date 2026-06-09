-- Realtime publication (BACKEND-ARCHITECTURE.md §3.5). Only the LIVE widgets subscribe via
-- browser `postgres_changes` (notification bell, dashboard activity feed, approvals queue, and
-- requisition/offer status). Supabase publishes row changes to subscribers through the
-- `supabase_realtime` publication, so each live table must be a member of it. RLS (0003) is the
-- sole guard on this user-JWT path — the publication only decides *which tables emit*, not which
-- rows a given user receives.
--
-- IDEMPOTENT: `alter publication ... add table` errors if the table is already a member, so we
-- check pg_publication_tables before each add. Safe to re-run.
do $$
declare
  t text;
  live_tables text[] := array[
    'notifications',
    'activities',
    'approval_requests',
    'approval_steps',
    'requisitions',
    'offers'
  ];
begin
  foreach t in array live_tables loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;
