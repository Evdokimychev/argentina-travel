-- Admin settings are a control plane: a batch, its optimistic-lock checks,
-- the public Edge snapshot and the audit trail must commit together.

alter table public.site_settings
  add column if not exists row_version bigint not null default 1;

alter table public.site_settings
  drop constraint if exists site_settings_row_version_positive;
alter table public.site_settings
  add constraint site_settings_row_version_positive check (row_version > 0);

create table if not exists public.site_settings_control_plane (
  singleton boolean primary key default true check (singleton),
  revision bigint not null default 1 check (revision > 0),
  features jsonb not null default '{}',
  navigation jsonb not null default '{}',
  modules jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.site_settings_control_plane enable row level security;

revoke all on table public.site_settings_control_plane from public, anon, authenticated;
grant select on table public.site_settings_control_plane to anon, authenticated;
grant select, insert, update, delete on table public.site_settings_control_plane to service_role;

drop policy if exists "site_settings_control_plane_public_read" on public.site_settings_control_plane;
create policy "site_settings_control_plane_public_read"
  on public.site_settings_control_plane
  for select
  to anon, authenticated
  using (singleton);

insert into public.site_settings_control_plane (
  singleton,
  revision,
  features,
  navigation,
  modules,
  updated_at
)
select
  true,
  greatest(1, coalesce(max(setting.row_version), 1)),
  coalesce((array_agg(setting.value) filter (where setting.key = 'site.features'))[1], '{}'::jsonb),
  coalesce((array_agg(setting.value) filter (where setting.key = 'site.navigation'))[1], '{}'::jsonb),
  coalesce((array_agg(setting.value) filter (where setting.key = 'site.modules'))[1], '{}'::jsonb),
  now()
from public.site_settings setting
on conflict (singleton) do nothing;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.refresh_site_settings_control_plane()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  insert into public.site_settings_control_plane (
    singleton,
    revision,
    features,
    navigation,
    modules,
    updated_at
  ) values (
    true,
    1,
    coalesce((select value from public.site_settings where key = 'site.features'), '{}'::jsonb),
    coalesce((select value from public.site_settings where key = 'site.navigation'), '{}'::jsonb),
    coalesce((select value from public.site_settings where key = 'site.modules'), '{}'::jsonb),
    now()
  )
  on conflict (singleton) do update
  set revision = public.site_settings_control_plane.revision + 1,
      features = excluded.features,
      navigation = excluded.navigation,
      modules = excluded.modules,
      updated_at = excluded.updated_at;

  return null;
end;
$$;

revoke all on function private.refresh_site_settings_control_plane() from public, anon, authenticated;

drop trigger if exists site_settings_refresh_control_plane on public.site_settings;
create trigger site_settings_refresh_control_plane
  after insert or update or delete on public.site_settings
  for each statement execute function private.refresh_site_settings_control_plane();

create or replace function public.admin_update_site_settings_atomic(
  p_updates jsonb,
  p_actor_user_id uuid,
  p_actor_kind text,
  p_ip_address text,
  p_confirmed_risks text[] default '{}'::text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed_keys constant text[] := array[
    'site.legal',
    'site.features',
    'site.branding',
    'site.seo',
    'site.contact',
    'site.navigation',
    'site.design',
    'site.blog',
    'site.commerce',
    'site.modules',
    'site.forms',
    'site.email',
    'site.marketing',
    'site.maintenance'
  ]::text[];
  item jsonb;
  setting_key text;
  expected_version bigint;
  current_row public.site_settings%rowtype;
  saved_rows jsonb := '[]'::jsonb;
begin
  if jsonb_typeof(p_updates) <> 'array'
    or jsonb_array_length(p_updates) = 0
    or jsonb_array_length(p_updates) > cardinality(allowed_keys)
  then
    raise exception using errcode = '22023', message = 'SETTINGS_BATCH_INVALID';
  end if;

  if coalesce(nullif(btrim(p_actor_kind), ''), '') not in ('session', 'service_role') then
    raise exception using errcode = '22023', message = 'SETTINGS_ACTOR_INVALID';
  end if;
  if p_actor_kind = 'session' and p_actor_user_id is null then
    raise exception using errcode = '22023', message = 'SETTINGS_ACTOR_INVALID';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_updates) candidate
    where jsonb_typeof(candidate) <> 'object'
      or not (candidate ? 'key')
      or not (candidate ? 'value')
      or not (candidate ? 'expectedVersion')
      or jsonb_typeof(candidate -> 'value') <> 'object'
      or jsonb_typeof(candidate -> 'expectedVersion') <> 'number'
      or candidate ->> 'expectedVersion' !~ '^(0|[1-9][0-9]*)$'
      or candidate ->> 'key' <> all(allowed_keys)
  ) then
    raise exception using errcode = '22023', message = 'SETTINGS_BATCH_INVALID';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_updates) candidate
    group by candidate ->> 'key'
    having count(*) > 1
  ) then
    raise exception using errcode = '22023', message = 'SETTINGS_BATCH_DUPLICATE_KEY';
  end if;
  if cardinality(coalesce(p_confirmed_risks, '{}'::text[])) > 50
    or exists (
      select 1
      from unnest(coalesce(p_confirmed_risks, '{}'::text[])) risk
      where length(risk) > 160
    )
  then
    raise exception using errcode = '22023', message = 'SETTINGS_RISKS_INVALID';
  end if;

  -- A stable lock order prevents two overlapping batch requests deadlocking.
  perform 1
  from public.site_settings setting
  join jsonb_array_elements(p_updates) candidate
    on setting.key = candidate ->> 'key'
  order by setting.key
  for update of setting;

  for item in
    select candidate
    from jsonb_array_elements(p_updates) candidate
    order by candidate ->> 'key'
  loop
    setting_key := item ->> 'key';
    begin
      expected_version := (item ->> 'expectedVersion')::bigint;
    exception when invalid_text_representation or numeric_value_out_of_range then
      raise exception using errcode = '22023', message = 'SETTINGS_VERSION_INVALID';
    end;
    if expected_version < 0 then
      raise exception using errcode = '22023', message = 'SETTINGS_VERSION_INVALID';
    end if;

    select * into current_row
    from public.site_settings
    where key = setting_key;

    if found and current_row.row_version <> expected_version then
      raise exception using errcode = '40001', message = 'SETTINGS_CONFLICT';
    end if;
    if not found and expected_version <> 0 then
      raise exception using errcode = '40001', message = 'SETTINGS_CONFLICT';
    end if;

    if current_row.key is null then
      insert into public.site_settings (key, value, updated_by, row_version)
      values (setting_key, item -> 'value', p_actor_user_id, 1)
      returning * into current_row;
    else
      update public.site_settings
      set value = item -> 'value',
          updated_by = p_actor_user_id,
          row_version = current_row.row_version + 1
      where key = setting_key
      returning * into current_row;
    end if;

    insert into public.admin_audit_log (
      actor_user_id,
      action,
      entity_type,
      entity_id,
      payload,
      ip_address
    ) values (
      p_actor_user_id,
      'settings.update',
      'site_settings',
      setting_key,
      jsonb_build_object(
        'actorKind', p_actor_kind,
        'previousVersion', expected_version,
        'rowVersion', current_row.row_version,
        'confirmedRisks', coalesce(p_confirmed_risks, '{}'::text[])
      ),
      left(p_ip_address, 128)
    );

    saved_rows := saved_rows || jsonb_build_array(jsonb_build_object(
      'key', setting_key,
      'rowVersion', current_row.row_version,
      'updatedAt', current_row.updated_at
    ));
  end loop;

  return jsonb_build_object('saved', saved_rows);
end;
$$;

revoke all on function public.admin_update_site_settings_atomic(jsonb, uuid, text, text, text[])
  from public, anon, authenticated;
grant execute on function public.admin_update_site_settings_atomic(jsonb, uuid, text, text, text[])
  to service_role;

comment on table public.site_settings_control_plane is
  'Public, non-secret Edge snapshot of operational feature, navigation and travel-module switches.';
comment on function public.admin_update_site_settings_atomic(jsonb, uuid, text, text, text[]) is
  'Service-role-only CAS settings batch with atomic public control-plane refresh and immutable audit.';
