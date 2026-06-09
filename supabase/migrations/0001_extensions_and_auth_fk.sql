-- Things Drizzle's column API can't express (BACKEND-ARCHITECTURE.md §5.7). Runs AFTER the
-- Drizzle table migration. Idempotent so it can be re-applied safely.

-- Trigram search for candidate/requisition lookups (searchCandidates, requisition search).
create extension if not exists pg_trgm;

-- Cross-schema FK: link our profile rows to Supabase Auth identities.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'users_auth_user_fk') then
    alter table public.users
      add constraint users_auth_user_fk
      foreign key (auth_user_id) references auth.users (id) on delete set null;
  end if;
end $$;

-- Trigram GIN indexes backing ILIKE search (cheap, optional — drop if not needed).
create index if not exists requisitions_title_trgm_idx on public.requisitions using gin (title gin_trgm_ops);
create index if not exists candidates_name_trgm_idx     on public.candidates   using gin (name gin_trgm_ops);
create index if not exists candidates_email_trgm_idx    on public.candidates   using gin (email gin_trgm_ops);
