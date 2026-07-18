-- Versioned, owner-editable transactional email templates.
-- Arbitrary HTML is deliberately not stored: body_blocks are rendered by the
-- application through the existing branded layout and escaped variable engine.

create or replace function public.email_template_blocks_valid(p_blocks jsonb)
returns boolean
language sql
immutable
security invoker
set search_path = pg_catalog
as $$
  select
    jsonb_typeof(p_blocks) = 'array'
    and jsonb_array_length(p_blocks) between 1 and 12
    and not exists (
      select 1
      from jsonb_array_elements(p_blocks) as block
      where jsonb_typeof(block) <> 'object'
        or block ->> 'type' not in ('paragraph', 'button', 'divider')
        or (block ->> 'type' = 'divider' and block - 'type' <> '{}'::jsonb)
        or (
          block ->> 'type' = 'paragraph'
          and (
            block - array['type', 'text'] <> '{}'::jsonb
            or
            jsonb_typeof(block -> 'text') <> 'string'
            or char_length(block ->> 'text') not between 1 and 2000
            or block ->> 'text' ~ '[<>]'
          )
        )
        or (
          block ->> 'type' = 'button'
          and (
            block - array['type', 'label', 'urlVariable'] <> '{}'::jsonb
            or
            jsonb_typeof(block -> 'label') <> 'string'
            or char_length(block ->> 'label') not between 1 and 120
            or block ->> 'label' ~ '[<>]'
            or coalesce(block ->> 'urlVariable', '') !~ '^[a-z][a-z0-9_]{1,63}$'
          )
        )
    );
$$;

revoke all on function public.email_template_blocks_valid(jsonb) from public, anon, authenticated;
grant execute on function public.email_template_blocks_valid(jsonb) to service_role;

create table public.email_template_versions (
  id uuid primary key default gen_random_uuid(),
  event_key text not null check (event_key ~ '^[a-z][a-z0-9_.-]{2,79}$'),
  locale text not null check (locale in ('ru', 'en', 'es', 'pt')),
  version integer not null check (version >= 1),
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  subject_template text not null check (
    char_length(subject_template) between 1 and 200
    and subject_template !~ '[<>\r\n]'
  ),
  body_blocks jsonb not null check (public.email_template_blocks_valid(body_blocks)),
  row_version integer not null default 1 check (row_version >= 1),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  activated_by uuid references public.profiles (id) on delete set null,
  activated_at timestamptz,
  source_version_id uuid references public.email_template_versions (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_key, locale, version)
);

create unique index email_template_one_active_idx
  on public.email_template_versions (event_key, locale)
  where status = 'active';
create unique index email_template_one_draft_idx
  on public.email_template_versions (event_key, locale)
  where status = 'draft';
create index email_template_history_idx
  on public.email_template_versions (event_key, locale, version desc);
create index email_template_created_by_idx
  on public.email_template_versions (created_by) where created_by is not null;
create index email_template_updated_by_idx
  on public.email_template_versions (updated_by) where updated_by is not null;
create index email_template_activated_by_idx
  on public.email_template_versions (activated_by) where activated_by is not null;
create index email_template_source_version_idx
  on public.email_template_versions (source_version_id) where source_version_id is not null;

drop trigger if exists email_template_versions_set_updated_at on public.email_template_versions;
create trigger email_template_versions_set_updated_at
  before update on public.email_template_versions
  for each row execute function public.set_updated_at();

alter table public.email_template_versions enable row level security;
revoke all on table public.email_template_versions from public, anon, authenticated;
grant select, insert, update on table public.email_template_versions to service_role;

comment on table public.email_template_versions is
  'Immutable email template history with one CAS-controlled active version per event and locale; service-role only.';

create or replace function public.email_template_create_draft(
  p_event_key text,
  p_locale text,
  p_subject_template text,
  p_body_blocks jsonb,
  p_expected_active_id uuid,
  p_actor_user_id uuid
)
returns public.email_template_versions
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_active_id uuid;
  v_next_version integer;
  v_row public.email_template_versions%rowtype;
begin
  if p_actor_user_id is null then
    raise exception using errcode = '22023', message = 'EMAIL_TEMPLATE_ACTOR_REQUIRED';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_event_key || ':' || p_locale, 0));
  select id into v_active_id
  from public.email_template_versions
  where event_key = p_event_key and locale = p_locale and status = 'active';

  if v_active_id is distinct from p_expected_active_id then
    raise exception using errcode = '40001', message = 'EMAIL_TEMPLATE_VERSION_CONFLICT';
  end if;
  if exists (
    select 1 from public.email_template_versions
    where event_key = p_event_key and locale = p_locale and status = 'draft'
  ) then
    raise exception using errcode = '40001', message = 'EMAIL_TEMPLATE_VERSION_CONFLICT';
  end if;

  select coalesce(max(version), 0) + 1 into v_next_version
  from public.email_template_versions
  where event_key = p_event_key and locale = p_locale;

  insert into public.email_template_versions (
    event_key, locale, version, status, subject_template, body_blocks,
    created_by, updated_by
  ) values (
    p_event_key, p_locale, v_next_version, 'draft', p_subject_template,
    p_body_blocks, p_actor_user_id, p_actor_user_id
  ) returning * into v_row;

  insert into public.admin_audit_log (actor_user_id, action, entity_type, entity_id, payload)
  values (
    p_actor_user_id,
    'email_template.draft_created',
    'email_template',
    v_row.id::text,
    jsonb_build_object('eventKey', p_event_key, 'locale', p_locale, 'version', v_next_version)
  );
  return v_row;
end;
$$;

create or replace function public.email_template_update_draft(
  p_template_id uuid,
  p_expected_event_key text,
  p_expected_version integer,
  p_subject_template text,
  p_body_blocks jsonb,
  p_actor_user_id uuid
)
returns public.email_template_versions
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_row public.email_template_versions%rowtype;
begin
  if p_actor_user_id is null then
    raise exception using errcode = '22023', message = 'EMAIL_TEMPLATE_ACTOR_REQUIRED';
  end if;

  update public.email_template_versions
  set subject_template = p_subject_template,
      body_blocks = p_body_blocks,
      row_version = row_version + 1,
      updated_by = p_actor_user_id
  where id = p_template_id and event_key = p_expected_event_key
    and status = 'draft' and row_version = p_expected_version
  returning * into v_row;

  if not found then
    raise exception using errcode = '40001', message = 'EMAIL_TEMPLATE_VERSION_CONFLICT';
  end if;

  insert into public.admin_audit_log (actor_user_id, action, entity_type, entity_id, payload)
  values (
    p_actor_user_id,
    'email_template.draft_updated',
    'email_template',
    v_row.id::text,
    jsonb_build_object('eventKey', v_row.event_key, 'locale', v_row.locale, 'version', v_row.version)
  );
  return v_row;
end;
$$;

create or replace function public.email_template_activate(
  p_template_id uuid,
  p_expected_event_key text,
  p_expected_version integer,
  p_expected_active_id uuid,
  p_actor_user_id uuid
)
returns public.email_template_versions
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_target public.email_template_versions%rowtype;
  v_active_id uuid;
begin
  if p_actor_user_id is null then
    raise exception using errcode = '22023', message = 'EMAIL_TEMPLATE_ACTOR_REQUIRED';
  end if;

  select * into v_target
  from public.email_template_versions
  where id = p_template_id
  for update;
  if not found or v_target.event_key <> p_expected_event_key
    or v_target.status <> 'draft' or v_target.row_version <> p_expected_version then
    raise exception using errcode = '40001', message = 'EMAIL_TEMPLATE_VERSION_CONFLICT';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_target.event_key || ':' || v_target.locale, 0));
  select id into v_active_id
  from public.email_template_versions
  where event_key = v_target.event_key and locale = v_target.locale and status = 'active';
  if v_active_id is distinct from p_expected_active_id then
    raise exception using errcode = '40001', message = 'EMAIL_TEMPLATE_VERSION_CONFLICT';
  end if;

  update public.email_template_versions
  set status = 'archived', row_version = row_version + 1, updated_by = p_actor_user_id
  where event_key = v_target.event_key and locale = v_target.locale and status = 'active';

  update public.email_template_versions
  set status = 'active', row_version = row_version + 1,
      activated_at = now(), activated_by = p_actor_user_id, updated_by = p_actor_user_id
  where id = p_template_id and status = 'draft' and row_version = p_expected_version
  returning * into v_target;
  if not found then
    raise exception using errcode = '40001', message = 'EMAIL_TEMPLATE_VERSION_CONFLICT';
  end if;

  insert into public.admin_audit_log (actor_user_id, action, entity_type, entity_id, payload)
  values (
    p_actor_user_id,
    'email_template.activated',
    'email_template',
    v_target.id::text,
    jsonb_build_object('eventKey', v_target.event_key, 'locale', v_target.locale, 'version', v_target.version)
  );
  return v_target;
end;
$$;

create or replace function public.email_template_rollback(
  p_source_template_id uuid,
  p_expected_event_key text,
  p_expected_active_version integer,
  p_actor_user_id uuid
)
returns public.email_template_versions
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_source public.email_template_versions%rowtype;
  v_active public.email_template_versions%rowtype;
  v_next_version integer;
  v_row public.email_template_versions%rowtype;
begin
  if p_actor_user_id is null then
    raise exception using errcode = '22023', message = 'EMAIL_TEMPLATE_ACTOR_REQUIRED';
  end if;

  select * into v_source
  from public.email_template_versions
  where id = p_source_template_id;
  if not found or v_source.event_key <> p_expected_event_key or v_source.status <> 'archived' then
    raise exception using errcode = '22023', message = 'EMAIL_TEMPLATE_ROLLBACK_SOURCE_INVALID';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_source.event_key || ':' || v_source.locale, 0));
  select * into v_active
  from public.email_template_versions
  where event_key = v_source.event_key and locale = v_source.locale and status = 'active'
  for update;
  if not found or v_active.row_version <> p_expected_active_version then
    raise exception using errcode = '40001', message = 'EMAIL_TEMPLATE_VERSION_CONFLICT';
  end if;

  select coalesce(max(version), 0) + 1 into v_next_version
  from public.email_template_versions
  where event_key = v_source.event_key and locale = v_source.locale;

  update public.email_template_versions
  set status = 'archived', row_version = row_version + 1, updated_by = p_actor_user_id
  where id = v_active.id and status = 'active' and row_version = p_expected_active_version;
  if not found then
    raise exception using errcode = '40001', message = 'EMAIL_TEMPLATE_VERSION_CONFLICT';
  end if;

  insert into public.email_template_versions (
    event_key, locale, version, status, subject_template, body_blocks,
    row_version, created_by, updated_by, activated_by, activated_at, source_version_id
  ) values (
    v_source.event_key, v_source.locale, v_next_version, 'active',
    v_source.subject_template, v_source.body_blocks, 1,
    p_actor_user_id, p_actor_user_id, p_actor_user_id, now(), v_source.id
  ) returning * into v_row;

  insert into public.admin_audit_log (actor_user_id, action, entity_type, entity_id, payload)
  values (
    p_actor_user_id,
    'email_template.rolled_back',
    'email_template',
    v_row.id::text,
    jsonb_build_object(
      'eventKey', v_row.event_key,
      'locale', v_row.locale,
      'version', v_row.version,
      'sourceVersion', v_source.version
    )
  );
  return v_row;
end;
$$;

revoke all on function public.email_template_create_draft(text, text, text, jsonb, uuid, uuid) from public, anon, authenticated;
revoke all on function public.email_template_update_draft(uuid, text, integer, text, jsonb, uuid) from public, anon, authenticated;
revoke all on function public.email_template_activate(uuid, text, integer, uuid, uuid) from public, anon, authenticated;
revoke all on function public.email_template_rollback(uuid, text, integer, uuid) from public, anon, authenticated;
grant execute on function public.email_template_create_draft(text, text, text, jsonb, uuid, uuid) to service_role;
grant execute on function public.email_template_update_draft(uuid, text, integer, text, jsonb, uuid) to service_role;
grant execute on function public.email_template_activate(uuid, text, integer, uuid, uuid) to service_role;
grant execute on function public.email_template_rollback(uuid, text, integer, uuid) to service_role;
