\set ON_ERROR_STOP on
begin;
do $$
declare
  admin_id uuid := '48000000-0000-4000-8000-000000000001';
  user_id uuid := '48000000-0000-4000-8000-000000000002';
  current_version bigint;
  result jsonb;
begin
  insert into auth.users(id, email, raw_user_meta_data) values
    (admin_id, 'user-directory-admin@example.invalid', '{}'::jsonb),
    (user_id, 'old-searchable-user@example.invalid', '{"first_name":"Old","last_name":"Searchable"}'::jsonb);
  insert into public.admin_staff(user_id, preset, capabilities, is_active)
  values (admin_id, 'super_admin', array['*']::text[], true);
  update public.profiles set roles = array['admin']::text[], active_role = 'admin' where id = admin_id;

  result := public.admin_search_profiles(admin_id, 'old-searchable', null, 'active', 25, 0);
  if (result->>'total')::integer <> 1 or jsonb_array_length(result->'users') <> 1 then
    raise exception 'server-side user search did not find the target';
  end if;

  select row_version into current_version from public.profiles where id = user_id;
  perform public.admin_update_user_profile_atomic(
    admin_id, user_id, current_version, array['tourist']::text[], 'tourist', true,
    'Проверено владельцем', '127.0.0.1'
  );
  if not exists (select 1 from public.profiles where id = user_id and is_blocked and admin_notes = 'Проверено владельцем') then
    raise exception 'atomic user update was not persisted';
  end if;
  if not exists (select 1 from public.admin_audit_log where actor_user_id = admin_id and entity_id = user_id::text and action = 'user.update') then
    raise exception 'atomic user audit is missing';
  end if;
  begin
    perform public.admin_update_user_profile_atomic(
      admin_id, user_id, current_version, array['tourist']::text[], 'tourist', false,
      null, null
    );
    raise exception 'stale user update unexpectedly succeeded';
  exception when serialization_failure then null;
  end;
end;
$$;
rollback;
