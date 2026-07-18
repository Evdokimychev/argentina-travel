-- Atomic CMS document lifecycle: optimistic concurrency, revisions, audit and search intent.

alter table public.content_documents
  add column if not exists row_version integer not null default 1;

alter table public.content_documents
  drop constraint if exists content_documents_row_version_positive;
alter table public.content_documents
  add constraint content_documents_row_version_positive check (row_version > 0);

create table if not exists public.cms_search_outbox (
  id uuid primary key default gen_random_uuid(),
  document_id text not null,
  document_version integer not null check (document_version > 0),
  intent text not null check (intent in ('upsert', 'delete')),
  document_snapshot jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  next_attempt_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_id, document_version)
);

create index if not exists cms_search_outbox_pending_idx
  on public.cms_search_outbox (next_attempt_at, created_at)
  where status in ('pending', 'failed');

drop trigger if exists cms_search_outbox_set_updated_at on public.cms_search_outbox;
create trigger cms_search_outbox_set_updated_at
  before update on public.cms_search_outbox
  for each row execute function public.set_updated_at();

alter table public.cms_search_outbox enable row level security;
revoke all on public.cms_search_outbox from public, anon, authenticated;
grant select, insert, update, delete on public.cms_search_outbox to service_role;

create table if not exists public.cms_import_operations (
  operation_id text primary key,
  payload_hash text not null check (length(payload_hash) = 64),
  actor_user_id uuid references public.profiles(id) on delete set null,
  status text not null default 'running' check (status in ('running', 'completed')),
  total_count integer not null check (total_count between 1 and 100),
  result jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

drop trigger if exists cms_import_operations_set_updated_at on public.cms_import_operations;
create trigger cms_import_operations_set_updated_at
  before update on public.cms_import_operations
  for each row execute function public.set_updated_at();

alter table public.cms_import_operations enable row level security;
revoke all on public.cms_import_operations from public, anon, authenticated;
grant select, insert, update, delete on public.cms_import_operations to service_role;

create or replace function public.cms_create_document_atomic(
  p_document_id text,
  p_doc_type text,
  p_slug text,
  p_locale text,
  p_title text,
  p_body jsonb,
  p_seo jsonb,
  p_status text,
  p_actor_id uuid,
  p_allow_publish boolean default false,
  p_ip_address text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  created_doc public.content_documents%rowtype;
begin
  if nullif(trim(p_document_id), '') is null
    or nullif(trim(p_slug), '') is null
    or nullif(trim(p_locale), '') is null
    or nullif(trim(p_title), '') is null
    or p_body is null
  then
    raise exception using errcode = '22023', message = 'CMS_INVALID_DOCUMENT';
  end if;

  if p_status not in ('draft', 'scheduled', 'published', 'archived') then
    raise exception using errcode = '22023', message = 'CMS_INVALID_STATUS';
  end if;
  if p_status = 'scheduled' then
    raise exception using errcode = '22023', message = 'CMS_SCHEDULE_REQUIRES_DATE';
  end if;
  if p_status = 'published' and not p_allow_publish then
    raise exception using errcode = '42501', message = 'CMS_PUBLISH_PERMISSION_REQUIRED';
  end if;

  insert into public.content_documents (
    id, doc_type, slug, locale, title, status, body, seo,
    published_at, scheduled_publish_at, created_by, updated_by, row_version
  ) values (
    p_document_id, p_doc_type, p_slug, p_locale, trim(p_title), p_status, p_body,
    coalesce(p_seo, '{}'::jsonb),
    case when p_status = 'published' then now() else null end,
    null, p_actor_id, p_actor_id, 1
  )
  returning * into created_doc;

  insert into public.content_revisions (
    document_id, revision_number, title, body, seo, created_by
  ) values (
    created_doc.id, 1, created_doc.title, created_doc.body, created_doc.seo, p_actor_id
  );

  insert into public.admin_audit_log (
    actor_user_id, action, entity_type, entity_id, payload, ip_address
  ) values (
    p_actor_id, 'cms.document.create', 'content_document', created_doc.id,
    jsonb_build_object(
      'docType', created_doc.doc_type,
      'status', created_doc.status,
      'rowVersion', created_doc.row_version
    ),
    p_ip_address
  );

  if created_doc.status = 'published' then
    insert into public.cms_search_outbox (
      document_id, document_version, intent, document_snapshot
    ) values (
      created_doc.id, created_doc.row_version, 'upsert', to_jsonb(created_doc)
    );
  end if;

  return jsonb_build_object('document', to_jsonb(created_doc), 'revisionNumber', 1);
exception
  when unique_violation then
    raise exception using errcode = '23505', message = 'CMS_DOCUMENT_ALREADY_EXISTS';
end;
$$;

create or replace function public.cms_mutate_document_atomic(
  p_document_id text,
  p_expected_version integer,
  p_actor_id uuid,
  p_operation text,
  p_allow_publish boolean default false,
  p_title text default null,
  p_body jsonb default null,
  p_seo jsonb default null,
  p_target_status text default null,
  p_scheduled_publish_at timestamptz default null,
  p_restore_revision_id uuid default null,
  p_ip_address text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  current_doc public.content_documents%rowtype;
  updated_doc public.content_documents%rowtype;
  restore_revision public.content_revisions%rowtype;
  next_status text;
  next_title text;
  next_body jsonb;
  next_seo jsonb;
  next_scheduled_at timestamptz;
  next_published_at timestamptz;
  next_revision integer;
  outbox_intent text;
begin
  if p_expected_version is null or p_expected_version < 1 then
    raise exception using errcode = '22023', message = 'CMS_EXPECTED_VERSION_REQUIRED';
  end if;
  if p_operation not in (
    'update', 'publish', 'schedule', 'unschedule', 'restore', 'restore_publish', 'publish_scheduled'
  ) then
    raise exception using errcode = '22023', message = 'CMS_INVALID_OPERATION';
  end if;

  select * into current_doc
  from public.content_documents
  where id = p_document_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'CMS_DOCUMENT_NOT_FOUND';
  end if;
  if current_doc.row_version <> p_expected_version then
    raise exception using errcode = '40001', message = 'CMS_STALE_VERSION';
  end if;

  next_status := coalesce(p_target_status, current_doc.status);
  next_title := coalesce(nullif(trim(p_title), ''), current_doc.title);
  next_body := coalesce(p_body, current_doc.body);
  next_seo := coalesce(p_seo, current_doc.seo);
  next_scheduled_at := current_doc.scheduled_publish_at;
  next_published_at := current_doc.published_at;

  if p_operation in ('restore', 'restore_publish') then
    if p_restore_revision_id is null then
      raise exception using errcode = '22023', message = 'CMS_REVISION_REQUIRED';
    end if;
    select * into restore_revision
    from public.content_revisions
    where id = p_restore_revision_id and document_id = p_document_id;
    if not found then
      raise exception using errcode = 'P0002', message = 'CMS_REVISION_NOT_FOUND';
    end if;
    next_title := restore_revision.title;
    next_body := restore_revision.body;
    next_seo := restore_revision.seo;
    next_status := case when p_operation = 'restore_publish' then 'published' else 'draft' end;
  elsif p_operation = 'publish' then
    next_status := 'published';
  elsif p_operation = 'schedule' then
    if current_doc.status = 'published' then
      raise exception using errcode = '22023', message = 'CMS_PUBLISHED_CANNOT_SCHEDULE';
    end if;
    next_status := 'scheduled';
  elsif p_operation = 'unschedule' then
    if current_doc.status <> 'scheduled' then
      raise exception using errcode = '22023', message = 'CMS_NOT_SCHEDULED';
    end if;
    next_status := 'draft';
  elsif p_operation = 'publish_scheduled' then
    if current_doc.status <> 'scheduled'
      or current_doc.scheduled_publish_at is null
      or current_doc.scheduled_publish_at > now()
    then
      raise exception using errcode = '22023', message = 'CMS_SCHEDULE_NOT_DUE';
    end if;
    next_status := 'published';
  end if;

  if next_status not in ('draft', 'scheduled', 'published', 'archived') then
    raise exception using errcode = '22023', message = 'CMS_INVALID_STATUS';
  end if;

  -- Published/scheduled content is a public promise: editing it or moving in/out
  -- of those states always requires the publish capability supplied by the server.
  if (current_doc.status in ('published', 'scheduled') or next_status in ('published', 'scheduled'))
    and not p_allow_publish
  then
    raise exception using errcode = '42501', message = 'CMS_PUBLISH_PERMISSION_REQUIRED';
  end if;

  if next_status = 'scheduled' then
    next_scheduled_at := case
      when p_operation = 'update' then coalesce(p_scheduled_publish_at, current_doc.scheduled_publish_at)
      else p_scheduled_publish_at
    end;
    if next_scheduled_at is null or next_scheduled_at <= now() then
      raise exception using errcode = '22023', message = 'CMS_SCHEDULE_MUST_BE_FUTURE';
    end if;
  else
    next_scheduled_at := null;
  end if;

  if next_status = 'published' then
    next_published_at := case
      when p_operation = 'publish_scheduled' then current_doc.scheduled_publish_at
      when current_doc.status = 'published' then coalesce(current_doc.published_at, now())
      else now()
    end;
  elsif next_status in ('draft', 'archived') then
    next_published_at := null;
  end if;

  update public.content_documents
  set title = next_title,
      body = next_body,
      seo = next_seo,
      status = next_status,
      published_at = next_published_at,
      scheduled_publish_at = next_scheduled_at,
      updated_by = p_actor_id,
      row_version = row_version + 1
  where id = p_document_id and row_version = p_expected_version
  returning * into updated_doc;

  if not found then
    raise exception using errcode = '40001', message = 'CMS_STALE_VERSION';
  end if;

  select coalesce(max(revision_number), 0) + 1 into next_revision
  from public.content_revisions
  where document_id = p_document_id;

  insert into public.content_revisions (
    document_id, revision_number, title, body, seo, created_by
  ) values (
    updated_doc.id, next_revision, updated_doc.title, updated_doc.body, updated_doc.seo, p_actor_id
  );

  insert into public.admin_audit_log (
    actor_user_id, action, entity_type, entity_id, payload, ip_address
  ) values (
    p_actor_id,
    'cms.document.' || p_operation,
    'content_document',
    updated_doc.id,
    jsonb_build_object(
      'fromStatus', current_doc.status,
      'toStatus', updated_doc.status,
      'previousVersion', current_doc.row_version,
      'rowVersion', updated_doc.row_version,
      'revisionNumber', next_revision,
      'restoredRevisionId', p_restore_revision_id
    ),
    p_ip_address
  );

  outbox_intent := case when updated_doc.status = 'published' then 'upsert' else 'delete' end;
  insert into public.cms_search_outbox (
    document_id, document_version, intent, document_snapshot
  ) values (
    updated_doc.id, updated_doc.row_version, outbox_intent, to_jsonb(updated_doc)
  );

  return jsonb_build_object(
    'document', to_jsonb(updated_doc),
    'revisionNumber', next_revision,
    'previousVersion', current_doc.row_version
  );
end;
$$;

create or replace function public.cms_publish_due_scheduled_atomic(
  p_limit integer default 100
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  due_doc record;
  mutation jsonb;
  published_ids jsonb := '[]'::jsonb;
begin
  if p_limit < 1 or p_limit > 500 then
    raise exception using errcode = '22023', message = 'CMS_INVALID_BATCH_LIMIT';
  end if;

  for due_doc in
    select id, row_version
    from public.content_documents
    where status = 'scheduled'
      and scheduled_publish_at is not null
      and scheduled_publish_at <= now()
    order by scheduled_publish_at, id
    limit p_limit
    for update skip locked
  loop
    mutation := public.cms_mutate_document_atomic(
      p_document_id => due_doc.id,
      p_expected_version => due_doc.row_version,
      p_actor_id => null,
      p_operation => 'publish_scheduled',
      p_allow_publish => true
    );
    published_ids := published_ids || jsonb_build_array(due_doc.id);
  end loop;

  return jsonb_build_object('publishedIds', published_ids);
end;
$$;

create or replace function public.cms_import_documents_atomic(
  p_operation_id text,
  p_payload_hash text,
  p_items jsonb,
  p_actor_id uuid,
  p_ip_address text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  operation_row public.cms_import_operations%rowtype;
  item jsonb;
  document_id text;
  doc_type text;
  slug_value text;
  locale_value text;
  title_value text;
  created_items jsonb := '[]'::jsonb;
  skipped_items jsonb := '[]'::jsonb;
  result_value jsonb;
  item_count integer;
begin
  item_count := case when jsonb_typeof(p_items) = 'array' then jsonb_array_length(p_items) else 0 end;
  if nullif(trim(p_operation_id), '') is null or length(p_operation_id) > 200 then
    raise exception using errcode = '22023', message = 'CMS_IMPORT_OPERATION_REQUIRED';
  end if;
  if p_payload_hash !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'CMS_IMPORT_HASH_INVALID';
  end if;
  if item_count < 1 or item_count > 100 then
    raise exception using errcode = '22023', message = 'CMS_IMPORT_ITEM_COUNT_INVALID';
  end if;

  insert into public.cms_import_operations (
    operation_id, payload_hash, actor_user_id, total_count
  ) values (
    p_operation_id, p_payload_hash, p_actor_id, item_count
  ) on conflict (operation_id) do nothing;

  select * into operation_row
  from public.cms_import_operations
  where operation_id = p_operation_id
  for update;

  if operation_row.payload_hash <> p_payload_hash then
    raise exception using errcode = '23505', message = 'CMS_IMPORT_OPERATION_CONFLICT';
  end if;
  if operation_row.status = 'completed' and operation_row.result is not null then
    return operation_row.result || jsonb_build_object('replayed', true);
  end if;

  for item in select value from jsonb_array_elements(p_items)
  loop
    doc_type := item->>'docType';
    slug_value := trim(coalesce(item->>'slug', ''));
    locale_value := trim(coalesce(item->>'locale', ''));
    title_value := trim(coalesce(item->>'title', ''));
    document_id := doc_type || ':' || slug_value || ':' || locale_value;

    if doc_type not in ('knowledge', 'blog')
      or slug_value = '' or locale_value = '' or title_value = ''
      or jsonb_typeof(item->'body') <> 'object'
    then
      raise exception using errcode = '22023', message = 'CMS_IMPORT_ITEM_INVALID';
    end if;

    if exists (select 1 from public.content_documents where id = document_id) then
      skipped_items := skipped_items || jsonb_build_array(jsonb_build_object(
        'id', coalesce(item->>'sourceId', document_id),
        'cmsId', document_id,
        'reason', 'already_imported'
      ));
      continue;
    end if;

    insert into public.content_documents (
      id, doc_type, slug, locale, title, status, body, seo,
      created_by, updated_by, row_version
    ) values (
      document_id, doc_type, slug_value, locale_value, title_value, 'draft',
      item->'body', coalesce(item->'seo', '{}'::jsonb), p_actor_id, p_actor_id, 1
    );

    insert into public.content_revisions (
      document_id, revision_number, title, body, seo, created_by
    ) values (
      document_id, 1, title_value, item->'body', coalesce(item->'seo', '{}'::jsonb), p_actor_id
    );

    created_items := created_items || jsonb_build_array(jsonb_build_object(
      'id', document_id,
      'sourceId', coalesce(item->>'sourceId', document_id),
      'cmsId', document_id,
      'title', title_value,
      'slug', slug_value,
      'status', 'draft',
      'rowVersion', 1
    ));
  end loop;

  result_value := jsonb_build_object(
    'ok', true,
    'operationId', p_operation_id,
    'created', created_items,
    'skipped', skipped_items,
    'replayed', false
  );

  update public.cms_import_operations
  set status = 'completed', result = result_value, completed_at = now()
  where operation_id = p_operation_id;

  insert into public.admin_audit_log (
    actor_user_id, action, entity_type, entity_id, payload, ip_address
  ) values (
    p_actor_id, 'cms.knowledge_import_atomic', 'content_import', p_operation_id,
    jsonb_build_object(
      'selected', item_count,
      'created', jsonb_array_length(created_items),
      'skipped', jsonb_array_length(skipped_items),
      'payloadHash', p_payload_hash
    ),
    p_ip_address
  );

  return result_value;
end;
$$;

revoke all on function public.cms_create_document_atomic(text, text, text, text, text, jsonb, jsonb, text, uuid, boolean, text) from public, anon, authenticated;
revoke all on function public.cms_mutate_document_atomic(text, integer, uuid, text, boolean, text, jsonb, jsonb, text, timestamptz, uuid, text) from public, anon, authenticated;
revoke all on function public.cms_publish_due_scheduled_atomic(integer) from public, anon, authenticated;
revoke all on function public.cms_import_documents_atomic(text, text, jsonb, uuid, text) from public, anon, authenticated;

grant execute on function public.cms_create_document_atomic(text, text, text, text, text, jsonb, jsonb, text, uuid, boolean, text) to service_role;
grant execute on function public.cms_mutate_document_atomic(text, integer, uuid, text, boolean, text, jsonb, jsonb, text, timestamptz, uuid, text) to service_role;
grant execute on function public.cms_publish_due_scheduled_atomic(integer) to service_role;
grant execute on function public.cms_import_documents_atomic(text, text, jsonb, uuid, text) to service_role;

comment on column public.content_documents.row_version is
  'Optimistic concurrency token. Every atomic CMS mutation increments it.';
comment on table public.cms_search_outbox is
  'Durable search synchronization intents written in the same transaction as CMS mutations.';
comment on table public.cms_import_operations is
  'Idempotent all-or-nothing CMS import operation ledger.';
