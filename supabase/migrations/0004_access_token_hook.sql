-- Custom Access Token Hook (BACKEND-ARCHITECTURE.md §3.2). On every token mint/refresh, mirror
-- the user's role + org_id from public.users into the JWT's app_metadata, so middleware reads
-- them without a DB hit and RLS (current_app_role / current_app_org) can scope rows.
--
-- OPTIONAL FOR DEV: the seed sets app_metadata.role/org_id at user-creation time, which Supabase
-- already includes in the JWT — so this hook is only needed to keep claims in sync on role
-- changes in production. To enable it: Supabase Dashboard → Authentication → Hooks →
-- "Custom Access Token" → select public.custom_access_token_hook.

-- VOLATILE (not STABLE): the function reads public.users, whose rows can change between calls;
-- STABLE would license Postgres to cache a stale role/org_id within a statement.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb language plpgsql volatile as $$
declare
  claims jsonb;
  v_role text;
  v_org  uuid;
begin
  select role::text, org_id into v_role, v_org
  from public.users
  where auth_user_id = (event ->> 'user_id')::uuid;

  claims := coalesce(event -> 'claims', '{}'::jsonb);
  if claims -> 'app_metadata' is null then
    claims := jsonb_set(claims, '{app_metadata}', '{}'::jsonb);
  end if;

  if v_role is not null then
    claims := jsonb_set(claims, '{app_metadata,role}', to_jsonb(v_role));
    claims := jsonb_set(claims, '{app_metadata,org_id}', to_jsonb(v_org));
  end if;

  return jsonb_set(event, '{claims}', claims);
end;
$$;

-- The auth admin role must be able to run the hook; nobody else.
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;
