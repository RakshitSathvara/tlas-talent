-- updated_at maintenance (BACKEND-ARCHITECTURE.md §6). One trigger function, attached to every
-- mutable table (append-only tables — candidate_stage_history, feedback, activities,
-- notifications, audit_log, files, interview_panelists — have no updated_at and are skipped).

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare tbl text;
begin
  foreach tbl in array array[
    'organizations','users','requisitions','candidates','interviews',
    'offers','approval_requests','approval_steps','templates',
    'stage_config','approval_chain_config'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I;', tbl);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at();', tbl);
  end loop;
end $$;
