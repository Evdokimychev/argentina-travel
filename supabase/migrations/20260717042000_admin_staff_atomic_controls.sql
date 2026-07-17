-- Staff trust-root changes must update the staff assignment, profile role and
-- immutable audit record in one transaction. HTTP handlers may validate input,
-- but only these service-role RPCs are allowed to mutate the relationship.

alter table public.admin_staff
  add column if not exists row_version bigint not null default 1;

alter table public.admin_staff
  drop constraint if exists admin_staff_row_version_positive;
alter table public.admin_staff
  add constraint admin_staff_row_version_positive check (row_version > 0);

create or replace function public.admin_assign_staff_atomic(
  p_actor_user_id uuid,
  p_target_user_id uuid,
  p_preset text,
  p_capabilities text[] default '{}'::text[],
  p_notes text default null,
  p_ip_address text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_roles text[];
begin
  if p_actor_user_id = p_target_user_id then
    raise exception using errcode = '42501', message = 'SELF_STAFF_MUTATION_FORBIDDEN';
  end if;

  perform 1
  from public.profiles profile
  join public.admin_staff staff on staff.user_id = profile.id
  where profile.id = p_actor_user_id
    and staff.is_active = true
    and staff.preset = 'super_admin'
    and '*' = any(staff.capabilities)
    and profile.roles @> array['admin']::text[]
    and not coalesce(profile.is_blocked, false)
  for update of profile, staff;
  if not found then
    raise exception using errcode = '42501', message = 'OWNER_REQUIRED';
  end if;

  select roles into target_roles
  from public.profiles
  where id = p_target_user_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'USER_NOT_FOUND';
  end if;

  if not exists (select 1 from public.admin_role_presets where id = p_preset) then
    raise exception using errcode = '22023', message = 'UNKNOWN_STAFF_PRESET';
  end if;
  if (p_preset = 'super_admin') <> ('*' = any(coalesce(p_capabilities, '{}'::text[]))) then
    raise exception using errcode = '22023', message = 'INCONSISTENT_OWNER_GRANT';
  end if;
  if exists (select 1 from public.admin_staff where user_id = p_target_user_id) then
    raise exception using errcode = '23505', message = 'STAFF_ALREADY_ASSIGNED';
  end if;

  insert into public.admin_staff (
    user_id, preset, capabilities, is_active, invited_by, notes
  ) values (
    p_target_user_id,
    p_preset,
    coalesce(p_capabilities, '{}'::text[]),
    true,
    p_actor_user_id,
    nullif(btrim(p_notes), '')
  );

  update public.profiles
  set roles = case
        when roles @> array['admin']::text[] then roles
        else array_append(roles, 'admin')
      end,
      active_role = 'admin'
  where id = p_target_user_id;

  insert into public.admin_audit_log (
    actor_user_id, action, entity_type, entity_id, payload, ip_address
  ) values (
    p_actor_user_id,
    'staff.assign',
    'admin_staff',
    p_target_user_id::text,
    jsonb_build_object('preset', p_preset, 'capabilities', coalesce(p_capabilities, '{}'::text[])),
    p_ip_address
  );

  return jsonb_build_object('userId', p_target_user_id, 'updated', true);
end;
$$;

create or replace function public.admin_update_staff_atomic(
  p_actor_user_id uuid,
  p_target_user_id uuid,
  p_expected_version bigint,
  p_preset text,
  p_capabilities text[],
  p_is_active boolean,
  p_notes text,
  p_ip_address text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_staff public.admin_staff%rowtype;
  changed_version bigint;
begin
  if p_actor_user_id = p_target_user_id then
    raise exception using errcode = '42501', message = 'SELF_STAFF_MUTATION_FORBIDDEN';
  end if;

  perform 1
  from public.profiles profile
  join public.admin_staff staff on staff.user_id = profile.id
  where profile.id = p_actor_user_id
    and staff.is_active = true
    and staff.preset = 'super_admin'
    and '*' = any(staff.capabilities)
    and profile.roles @> array['admin']::text[]
    and not coalesce(profile.is_blocked, false)
  for update of profile, staff;
  if not found then
    raise exception using errcode = '42501', message = 'OWNER_REQUIRED';
  end if;

  select * into current_staff
  from public.admin_staff
  where user_id = p_target_user_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'STAFF_NOT_FOUND';
  end if;
  if current_staff.row_version <> p_expected_version then
    raise exception using errcode = '40001', message = 'STAFF_CONFLICT';
  end if;
  if current_staff.preset = 'super_admin' and '*' = any(current_staff.capabilities) then
    raise exception using errcode = '42501', message = 'OWNER_STAFF_MUTATION_FORBIDDEN';
  end if;
  if not exists (select 1 from public.admin_role_presets where id = p_preset) then
    raise exception using errcode = '22023', message = 'UNKNOWN_STAFF_PRESET';
  end if;
  if (p_preset = 'super_admin') <> ('*' = any(coalesce(p_capabilities, '{}'::text[]))) then
    raise exception using errcode = '22023', message = 'INCONSISTENT_OWNER_GRANT';
  end if;

  update public.admin_staff
  set preset = p_preset,
      capabilities = coalesce(p_capabilities, '{}'::text[]),
      is_active = p_is_active,
      notes = nullif(btrim(p_notes), ''),
      row_version = current_staff.row_version + 1
  where user_id = p_target_user_id
  returning row_version into changed_version;

  insert into public.admin_audit_log (
    actor_user_id, action, entity_type, entity_id, payload, ip_address
  ) values (
    p_actor_user_id,
    'staff.update',
    'admin_staff',
    p_target_user_id::text,
    jsonb_build_object(
      'preset', p_preset,
      'capabilities', coalesce(p_capabilities, '{}'::text[]),
      'isActive', p_is_active,
      'notesChanged', current_staff.notes is distinct from nullif(btrim(p_notes), '')
    ),
    p_ip_address
  );

  return jsonb_build_object('userId', p_target_user_id, 'rowVersion', changed_version);
end;
$$;

create or replace function public.admin_remove_staff_atomic(
  p_actor_user_id uuid,
  p_target_user_id uuid,
  p_expected_version bigint,
  p_ip_address text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_staff public.admin_staff%rowtype;
begin
  if p_actor_user_id = p_target_user_id then
    raise exception using errcode = '42501', message = 'SELF_STAFF_MUTATION_FORBIDDEN';
  end if;

  perform 1
  from public.profiles profile
  join public.admin_staff staff on staff.user_id = profile.id
  where profile.id = p_actor_user_id
    and staff.is_active = true
    and staff.preset = 'super_admin'
    and '*' = any(staff.capabilities)
    and profile.roles @> array['admin']::text[]
    and not coalesce(profile.is_blocked, false)
  for update of profile, staff;
  if not found then
    raise exception using errcode = '42501', message = 'OWNER_REQUIRED';
  end if;

  select * into current_staff
  from public.admin_staff
  where user_id = p_target_user_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'STAFF_NOT_FOUND';
  end if;
  if current_staff.row_version <> p_expected_version then
    raise exception using errcode = '40001', message = 'STAFF_CONFLICT';
  end if;
  if current_staff.preset = 'super_admin' and '*' = any(current_staff.capabilities) then
    raise exception using errcode = '42501', message = 'OWNER_STAFF_MUTATION_FORBIDDEN';
  end if;

  delete from public.admin_staff where user_id = p_target_user_id;

  update public.profiles
  set roles = case
        when cardinality(array_remove(roles, 'admin')) = 0 then array['tourist']::text[]
        else array_remove(roles, 'admin')
      end,
      active_role = case
        when active_role = 'admin' then
          coalesce((array_remove(roles, 'admin'))[1], 'tourist')
        else active_role
      end
  where id = p_target_user_id;

  insert into public.admin_audit_log (
    actor_user_id, action, entity_type, entity_id, payload, ip_address
  ) values (
    p_actor_user_id,
    'staff.remove',
    'admin_staff',
    p_target_user_id::text,
    jsonb_build_object('preset', current_staff.preset, 'capabilities', current_staff.capabilities),
    p_ip_address
  );

  return jsonb_build_object('userId', p_target_user_id, 'removed', true);
end;
$$;

revoke all on function public.admin_assign_staff_atomic(uuid, uuid, text, text[], text, text) from public, anon, authenticated;
revoke all on function public.admin_update_staff_atomic(uuid, uuid, bigint, text, text[], boolean, text, text) from public, anon, authenticated;
revoke all on function public.admin_remove_staff_atomic(uuid, uuid, bigint, text) from public, anon, authenticated;
grant execute on function public.admin_assign_staff_atomic(uuid, uuid, text, text[], text, text) to service_role;
grant execute on function public.admin_update_staff_atomic(uuid, uuid, bigint, text, text[], boolean, text, text) to service_role;
grant execute on function public.admin_remove_staff_atomic(uuid, uuid, bigint, text) to service_role;

comment on function public.admin_assign_staff_atomic(uuid, uuid, text, text[], text, text) is
  'Owner-only atomic staff assignment, profile grant and audit. Service role only.';
comment on function public.admin_update_staff_atomic(uuid, uuid, bigint, text, text[], boolean, text, text) is
  'Owner-only CAS update of a non-owner staff assignment with atomic audit. Service role only.';
comment on function public.admin_remove_staff_atomic(uuid, uuid, bigint, text) is
  'Owner-only atomic staff removal, profile role cleanup and audit. Service role only.';
