begin;

do $$
declare
  owner_id uuid := gen_random_uuid();
  target_id uuid := gen_random_uuid();
  first_version bigint;
  audit_count integer;
begin
  insert into auth.users (id, email, raw_user_meta_data)
  values
    (owner_id, 'owner-staff-atomic@example.invalid', '{"first_name":"Owner","last_name":"Atomic"}'::jsonb),
    (target_id, 'target-staff-atomic@example.invalid', '{"first_name":"Target","last_name":"Atomic"}'::jsonb);
  insert into public.admin_staff (user_id, preset, capabilities, is_active)
  values (owner_id, 'super_admin', array['*']::text[], true);
  update public.profiles
  set roles = array['admin']::text[], active_role = 'admin'
  where id = owner_id;

  perform public.admin_assign_staff_atomic(
    owner_id, target_id, 'support_agent', '{}'::text[], 'Support', null
  );
  if not exists (
    select 1 from public.profiles
    where id = target_id and roles @> array['admin']::text[] and active_role = 'admin'
  ) then
    raise exception 'assign did not grant the admin profile role';
  end if;

  select row_version into first_version from public.admin_staff where user_id = target_id;
  perform public.admin_update_staff_atomic(
    owner_id, target_id, first_version, 'content_editor', '{}'::text[], false, 'Paused', null
  );
  if not exists (
    select 1 from public.admin_staff
    where user_id = target_id and preset = 'content_editor' and not is_active
  ) then
    raise exception 'CAS update did not persist';
  end if;

  begin
    perform public.admin_update_staff_atomic(
      owner_id, target_id, first_version, 'support_agent', '{}'::text[], true, null, null
    );
    raise exception 'stale update unexpectedly succeeded';
  exception when serialization_failure then
    null;
  end;

  select row_version into first_version from public.admin_staff where user_id = target_id;
  perform public.admin_remove_staff_atomic(owner_id, target_id, first_version, null);
  if exists (select 1 from public.admin_staff where user_id = target_id) then
    raise exception 'staff row survived removal';
  end if;
  if exists (select 1 from public.profiles where id = target_id and roles @> array['admin']::text[]) then
    raise exception 'admin profile role survived removal';
  end if;

  select count(*) into audit_count
  from public.admin_audit_log
  where actor_user_id = owner_id and entity_id = target_id::text
    and action in ('staff.assign', 'staff.update', 'staff.remove');
  if audit_count <> 3 then
    raise exception 'expected 3 atomic staff audit rows, got %', audit_count;
  end if;
end;
$$;

rollback;
