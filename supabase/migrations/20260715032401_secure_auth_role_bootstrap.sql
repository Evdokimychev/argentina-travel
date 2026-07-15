-- Prevent self-assigned privileged roles through user-editable auth metadata.
-- Existing production admins are made explicit staff members before bootstrap
-- access is removed, preserving the verified owner account.

insert into public.admin_staff (user_id, preset, capabilities, is_active, notes)
select p.id, 'super_admin', array['*']::text[], true, 'Backfilled during secure auth bootstrap migration'
from public.profiles p
where p.roles @> array['admin']::text[]
on conflict (user_id) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb;
begin
  meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);

  insert into public.profiles (
    id,
    email,
    first_name,
    last_name,
    phone,
    country,
    date_of_birth,
    roles,
    active_role
  )
  values (
    new.id,
    new.email,
    coalesce(meta->>'first_name', ''),
    coalesce(meta->>'last_name', ''),
    nullif(meta->>'phone', ''),
    coalesce(meta->>'country', 'Россия'),
    nullif(meta->>'date_of_birth', '')::date,
    array['tourist']::text[],
    'tourist'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

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
    where s.user_id = (select auth.uid())
      and s.is_active = true
      and p.roles @> array['admin']::text[]
      and not coalesce(p.is_blocked, false)
      and (
        '*' = any(s.capabilities)
        or required_capability = any(s.capabilities)
      )
  );
$$;

revoke all on function public.is_admin_with(text) from public;
grant execute on function public.is_admin_with(text) to authenticated, service_role;

comment on table public.admin_staff is
  'Explicit granular admin assignments; an admin profile without an active staff row has no admin access.';

-- Consume booking lookup challenges with a single conditional row update so
-- concurrent requests cannot reuse an OTP or lose attempt increments.
create or replace function public.consume_booking_lookup_challenge(
  p_challenge_id uuid,
  p_code_hash text,
  p_session_token_hash text,
  p_session_expires_at timestamptz
)
returns table(status text, attempts smallint)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.booking_lookup_challenges c
  set attempts = (c.attempts + 1)::smallint,
      consumed_at = now(),
      session_token_hash = p_session_token_hash,
      session_expires_at = p_session_expires_at
  where c.id = p_challenge_id
    and c.consumed_at is null
    and c.expires_at > now()
    and c.attempts < c.max_attempts
    and cardinality(c.booking_ids) > 0
    and c.code_hash = p_code_hash
  returning 'accepted'::text, c.attempts;

  if found then return; end if;

  return query
  update public.booking_lookup_challenges c
  set attempts = (c.attempts + 1)::smallint
  where c.id = p_challenge_id
    and c.consumed_at is null
    and c.expires_at > now()
    and c.attempts < c.max_attempts
  returning 'rejected'::text, c.attempts;

  if found then return; end if;
  return query select 'invalid'::text, 0::smallint;
end;
$$;

revoke all on function public.consume_booking_lookup_challenge(uuid, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.consume_booking_lookup_challenge(uuid, text, text, timestamptz) to service_role;
