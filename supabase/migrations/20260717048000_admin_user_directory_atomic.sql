alter table public.profiles
  add column if not exists row_version bigint not null default 1;

alter table public.profiles
  drop constraint if exists profiles_row_version_positive;
alter table public.profiles
  add constraint profiles_row_version_positive check (row_version > 0);

create or replace function public.admin_actor_has_capability(
  p_actor_user_id uuid,
  p_capability text
)
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.admin_staff s
    join public.profiles p on p.id = s.user_id
    left join public.admin_role_presets r on r.id = s.preset
    where s.user_id = p_actor_user_id
      and s.is_active
      and p.roles @> array['admin']::text[]
      and not coalesce(p.is_blocked, false)
      and (
        '*' = any(coalesce(s.capabilities, '{}'::text[]) || coalesce(r.capabilities, '{}'::text[]))
        or p_capability = any(coalesce(s.capabilities, '{}'::text[]) || coalesce(r.capabilities, '{}'::text[]))
      )
  );
$$;

create or replace function public.admin_search_profiles(
  p_actor_user_id uuid,
  p_query text default null,
  p_role text default null,
  p_status text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = pg_catalog, public
as $$
declare
  safe_limit integer := least(greatest(coalesce(p_limit, 50), 1), 100);
  safe_offset integer := greatest(coalesce(p_offset, 0), 0);
  normalized_query text := lower(btrim(coalesce(p_query, '')));
  result jsonb;
begin
  if not public.admin_actor_has_capability(p_actor_user_id, 'users.view') then
    raise exception using errcode = '42501', message = 'ADMIN_CAPABILITY_REQUIRED';
  end if;
  if p_role is not null and p_role not in ('tourist', 'organizer', 'admin') then
    raise exception using errcode = '22023', message = 'INVALID_ROLE_FILTER';
  end if;
  if p_status is not null and p_status not in ('active', 'blocked') then
    raise exception using errcode = '22023', message = 'INVALID_STATUS_FILTER';
  end if;

  with filtered as (
    select p.*
    from public.profiles p
    where (p_role is null or p.roles @> array[p_role]::text[])
      and (p_status is null
        or (p_status = 'blocked' and coalesce(p.is_blocked, false))
        or (p_status = 'active' and not coalesce(p.is_blocked, false)))
      and (normalized_query = '' or strpos(lower(concat_ws(' ',
        p.first_name, p.last_name, p.email, p.phone, array_to_string(p.roles, ' ')
      )), normalized_query) > 0)
  ), page as (
    select * from filtered order by created_at desc, id desc limit safe_limit offset safe_offset
  )
  select jsonb_build_object(
    'users', coalesce((select jsonb_agg(jsonb_build_object(
      'id', id,
      'fullName', coalesce(nullif(btrim(concat_ws(' ', first_name, last_name)), ''), '—'),
      'email', email,
      'phone', phone,
      'roles', roles,
      'activeRole', active_role,
      'isBlocked', coalesce(is_blocked, false),
      'adminNotes', admin_notes,
      'createdAt', created_at
    ) order by created_at desc, id desc) from page), '[]'::jsonb),
    'total', (select count(*) from filtered),
    'limit', safe_limit,
    'offset', safe_offset
  ) into result;
  return result;
end;
$$;

create or replace function public.admin_update_user_profile_atomic(
  p_actor_user_id uuid,
  p_target_user_id uuid,
  p_expected_version bigint,
  p_next_roles text[],
  p_next_active_role text,
  p_next_is_blocked boolean,
  p_next_admin_notes text,
  p_ip_address text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  current_profile public.profiles%rowtype;
  updated_profile public.profiles%rowtype;
begin
  if not public.admin_actor_has_capability(p_actor_user_id, 'users.manage') then
    raise exception using errcode = '42501', message = 'ADMIN_CAPABILITY_REQUIRED';
  end if;
  if p_actor_user_id = p_target_user_id then
    raise exception using errcode = '42501', message = 'SELF_IDENTITY_CHANGE_FORBIDDEN';
  end if;
  select * into current_profile from public.profiles where id = p_target_user_id for update;
  if current_profile.id is null then raise exception using errcode = 'P0002', message = 'USER_NOT_FOUND'; end if;
  if current_profile.row_version <> p_expected_version then
    raise exception using errcode = '40001', message = 'VERSION_CONFLICT';
  end if;
  if exists (select 1 from public.admin_staff where user_id = p_target_user_id)
    or current_profile.roles @> array['admin']::text[] then
    raise exception using errcode = '42501', message = 'STAFF_IDENTITY_MANAGED_SEPARATELY';
  end if;
  if cardinality(p_next_roles) < 1
    or not (p_next_roles <@ array['tourist', 'organizer']::text[])
    or p_next_active_role <> all(p_next_roles) then
    raise exception using errcode = '22023', message = 'INVALID_ACCOUNT_ROLES';
  end if;
  if 'organizer' = any(p_next_roles) and not exists (
    select 1 from public.organizer_applications
    where user_id = p_target_user_id and status = 'approved'
  ) then raise exception using errcode = '23514', message = 'ORGANIZER_APPROVAL_REQUIRED';
  end if;

  update public.profiles
  set roles = p_next_roles,
      active_role = p_next_active_role,
      is_blocked = p_next_is_blocked,
      admin_notes = nullif(btrim(coalesce(p_next_admin_notes, '')), ''),
      row_version = row_version + 1
  where id = p_target_user_id
  returning * into updated_profile;

  insert into public.admin_audit_log(
    actor_user_id, action, entity_type, entity_id, payload, ip_address
  ) values (
    p_actor_user_id,
    'user.update',
    'profile',
    p_target_user_id::text,
    jsonb_build_object(
      'rolesChanged', current_profile.roles is distinct from updated_profile.roles,
      'activeRoleChanged', current_profile.active_role is distinct from updated_profile.active_role,
      'blockedChanged', current_profile.is_blocked is distinct from updated_profile.is_blocked,
      'adminNotesChanged', current_profile.admin_notes is distinct from updated_profile.admin_notes
    ),
    nullif(left(btrim(coalesce(p_ip_address, '')), 128), '')
  );
  return jsonb_build_object('id', updated_profile.id, 'rowVersion', updated_profile.row_version);
end;
$$;

revoke all on function public.admin_actor_has_capability(uuid,text) from public, anon, authenticated;
revoke all on function public.admin_search_profiles(uuid,text,text,text,integer,integer) from public, anon, authenticated;
revoke all on function public.admin_update_user_profile_atomic(uuid,uuid,bigint,text[],text,boolean,text,text) from public, anon, authenticated;
grant execute on function public.admin_actor_has_capability(uuid,text) to service_role;
grant execute on function public.admin_search_profiles(uuid,text,text,text,integer,integer) to service_role;
grant execute on function public.admin_update_user_profile_atomic(uuid,uuid,bigint,text[],text,boolean,text,text) to service_role;

update public.admin_role_presets
set capabilities = case
  when 'operations.email' = any(capabilities) then capabilities
  else array_append(capabilities, 'operations.email')
end
where id = 'operations_manager';
