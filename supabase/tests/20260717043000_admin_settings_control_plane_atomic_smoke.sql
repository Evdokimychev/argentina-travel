begin;

do $$
declare
  features_version bigint;
  navigation_version bigint;
  revision_before bigint;
  result jsonb;
  audit_before integer;
  features_before jsonb;
begin
  insert into public.site_settings (key, value)
  values
    ('site.features', '{"maintenanceMode":false,"allowOrganizerSignup":true}'::jsonb),
    ('site.navigation', '{"showForum":true,"showShop":true}'::jsonb),
    ('site.modules', '{"apartmentsMode":"request"}'::jsonb)
  on conflict (key) do nothing;

  select row_version into features_version
  from public.site_settings where key = 'site.features';
  select row_version into navigation_version
  from public.site_settings where key = 'site.navigation';
  select revision into revision_before
  from public.site_settings_control_plane where singleton;

  result := public.admin_update_site_settings_atomic(
    jsonb_build_array(
      jsonb_build_object(
        'key', 'site.features',
        'value', '{"maintenanceMode":true,"allowOrganizerSignup":true}'::jsonb,
        'expectedVersion', features_version
      ),
      jsonb_build_object(
        'key', 'site.navigation',
        'value', '{"showForum":false,"showShop":true}'::jsonb,
        'expectedVersion', navigation_version
      )
    ),
    null,
    'service_role',
    '127.0.0.1',
    array['site.features:maintenanceMode:on', 'site.navigation:showForum:off']::text[]
  );

  if jsonb_array_length(result -> 'saved') <> 2 then
    raise exception 'atomic settings result did not return both saved rows';
  end if;
  if not exists (
    select 1 from public.site_settings
    where key = 'site.features'
      and row_version = features_version + 1
      and value ->> 'maintenanceMode' = 'true'
  ) then
    raise exception 'features CAS update did not persist';
  end if;
  if not exists (
    select 1 from public.site_settings_control_plane
    where singleton
      and revision > revision_before
      and features ->> 'maintenanceMode' = 'true'
      and navigation ->> 'showForum' = 'false'
  ) then
    raise exception 'durable Edge control snapshot did not refresh atomically';
  end if;
  if (
    select count(*) from public.admin_audit_log
    where action = 'settings.update'
      and entity_id in ('site.features', 'site.navigation')
      and payload ->> 'actorKind' = 'service_role'
  ) <> 2 then
    raise exception 'atomic settings audit rows are missing';
  end if;
  if exists (
    select 1 from public.admin_audit_log
    where action = 'settings.update'
      and payload ? 'value'
  ) then
    raise exception 'settings values leaked into the audit payload';
  end if;

  select row_version, value into features_version, features_before
  from public.site_settings where key = 'site.features';
  select row_version into navigation_version
  from public.site_settings where key = 'site.navigation';
  select count(*) into audit_before
  from public.admin_audit_log where action = 'settings.update';

  begin
    perform public.admin_update_site_settings_atomic(
      jsonb_build_array(
        jsonb_build_object(
          'key', 'site.features',
          'value', '{"maintenanceMode":false}'::jsonb,
          'expectedVersion', features_version
        ),
        jsonb_build_object(
          'key', 'site.navigation',
          'value', '{"showForum":true}'::jsonb,
          'expectedVersion', navigation_version - 1
        )
      ),
      null,
      'service_role',
      null,
      '{}'::text[]
    );
    raise exception 'stale settings batch unexpectedly succeeded';
  exception when serialization_failure then
    null;
  end;

  if (select value from public.site_settings where key = 'site.features') <> features_before then
    raise exception 'a failed batch left a partial settings update';
  end if;
  if (select count(*) from public.admin_audit_log where action = 'settings.update') <> audit_before then
    raise exception 'a failed batch left a partial audit record';
  end if;

  begin
    perform public.admin_update_site_settings_atomic(
      '[{"key":"site.unknown","value":{},"expectedVersion":0}]'::jsonb,
      null,
      'service_role',
      null,
      '{}'::text[]
    );
    raise exception 'unknown settings key unexpectedly succeeded';
  exception when invalid_parameter_value then
    null;
  end;

  if not has_table_privilege('anon', 'public.site_settings_control_plane', 'select')
    or has_table_privilege('anon', 'public.site_settings_control_plane', 'update')
  then
    raise exception 'public control-plane privileges are not read-only';
  end if;
  if has_function_privilege(
    'anon',
    'public.admin_update_site_settings_atomic(jsonb,uuid,text,text,text[])',
    'execute'
  ) then
    raise exception 'anonymous role can execute the settings mutation RPC';
  end if;
end;
$$;

rollback;
