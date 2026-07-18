-- Resolve effective admin permissions from both the selected preset and
-- per-user capability overrides. The previous function only read overrides,
-- leaving newly assigned preset staff without access.
create or replace function public.is_admin_with(required_capability text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_staff s
    join public.profiles p on p.id = s.user_id
    left join public.admin_role_presets r on r.id = s.preset
    where s.user_id = (select auth.uid())
      and s.is_active = true
      and p.roles @> array['admin']::text[]
      and not coalesce(p.is_blocked, false)
      and (
        '*' = any(coalesce(s.capabilities, '{}'::text[]) || coalesce(r.capabilities, '{}'::text[]))
        or required_capability = any(
          coalesce(s.capabilities, '{}'::text[]) || coalesce(r.capabilities, '{}'::text[])
        )
      )
  );
$$;

revoke all on function public.is_admin_with(text) from public;
grant execute on function public.is_admin_with(text) to authenticated, service_role;

comment on function public.is_admin_with(text) is
  'Checks effective admin capabilities from active staff preset plus explicit overrides.';
