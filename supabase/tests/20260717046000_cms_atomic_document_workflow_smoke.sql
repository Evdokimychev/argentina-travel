\set ON_ERROR_STOP on

begin;

do $$
declare
  actor constant uuid := '46000000-0000-4000-8000-000000000001';
  response jsonb;
  current_version integer;
  operation_result jsonb;
  import_items jsonb := jsonb_build_array(
    jsonb_build_object(
      'sourceId', 'kb-one', 'docType', 'knowledge', 'slug', 'atomic-kb-one',
      'locale', 'ru', 'title', 'Первый атомарный материал',
      'body', jsonb_build_object('kind', 'blog', 'content', 'Проверенный основной текст'),
      'seo', jsonb_build_object('noIndex', true)
    ),
    jsonb_build_object(
      'sourceId', 'kb-two', 'docType', 'knowledge', 'slug', 'atomic-kb-two',
      'locale', 'ru', 'title', 'Второй атомарный материал',
      'body', jsonb_build_object('kind', 'blog', 'content', 'Ещё один проверенный текст'),
      'seo', jsonb_build_object('noIndex', true)
    )
  );
begin
  insert into auth.users(id, email, raw_user_meta_data)
  values (actor, 'cms-atomic@example.invalid', '{}'::jsonb);

  response := public.cms_create_document_atomic(
    'blog:atomic-workflow:ru', 'blog', 'atomic-workflow', 'ru',
    'Атомарный редакционный материал',
    '{"kind":"blog","content":"Исходный проверенный текст"}'::jsonb,
    '{"noIndex":true}'::jsonb, 'draft', actor, false, '127.0.0.1'
  );
  if response#>>'{document,row_version}' <> '1' then
    raise exception 'create did not return row version: %', response;
  end if;
  if (select count(*) from public.content_revisions where document_id = 'blog:atomic-workflow:ru') <> 1 then
    raise exception 'create revision was not atomic';
  end if;

  response := public.cms_mutate_document_atomic(
    'blog:atomic-workflow:ru', 1, actor, 'update', false,
    'Атомарный материал: новая редакция',
    '{"kind":"blog","content":"Новая проверенная редакция"}'::jsonb,
    null, null, null, null, '127.0.0.1'
  );
  current_version := (response#>>'{document,row_version}')::integer;
  if current_version <> 2 then raise exception 'update did not increment version: %', response; end if;

  begin
    perform public.cms_mutate_document_atomic(
      'blog:atomic-workflow:ru', 1, actor, 'update', false,
      'Устаревшая редакция', null, null, null, null, null, null
    );
    raise exception 'stale mutation unexpectedly succeeded';
  exception when serialization_failure then
    null;
  end;

  begin
    perform public.cms_mutate_document_atomic(
      'blog:atomic-workflow:ru', current_version, actor, 'publish', false
    );
    raise exception 'publish without permission unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;

  response := public.cms_mutate_document_atomic(
    'blog:atomic-workflow:ru', current_version, actor, 'publish', true
  );
  current_version := (response#>>'{document,row_version}')::integer;
  if not exists (
    select 1 from public.cms_search_outbox
    where document_id = 'blog:atomic-workflow:ru'
      and cms_search_outbox.document_version = current_version
      and intent = 'upsert'
  ) then
    raise exception 'publish search intent is missing';
  end if;

  begin
    perform public.cms_mutate_document_atomic(
      'blog:atomic-workflow:ru', current_version, actor, 'update', false,
      null, null, null, 'draft'
    );
    raise exception 'unpublish without permission unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;

  response := public.cms_mutate_document_atomic(
    'blog:atomic-workflow:ru', current_version, actor, 'update', true,
    null, null, null, 'draft'
  );
  current_version := (response#>>'{document,row_version}')::integer;
  response := public.cms_mutate_document_atomic(
    'blog:atomic-workflow:ru', current_version, actor, 'schedule', true,
    null, null, null, null, now() + interval '2 minutes'
  );
  current_version := (response#>>'{document,row_version}')::integer;

  update public.content_documents
  set scheduled_publish_at = now() - interval '1 minute'
  where id = 'blog:atomic-workflow:ru';
  response := public.cms_publish_due_scheduled_atomic(10);
  if not (response->'publishedIds' ? 'blog:atomic-workflow:ru') then
    raise exception 'due schedule was not published: %', response;
  end if;
  if (select status from public.content_documents where id = 'blog:atomic-workflow:ru') <> 'published' then
    raise exception 'scheduled publication did not persist';
  end if;

  operation_result := public.cms_import_documents_atomic(
    'cms-smoke-operation-0001', repeat('a', 64), import_items, actor, '127.0.0.1'
  );
  if jsonb_array_length(operation_result->'created') <> 2 then
    raise exception 'atomic import did not create both rows: %', operation_result;
  end if;
  operation_result := public.cms_import_documents_atomic(
    'cms-smoke-operation-0001', repeat('a', 64), import_items, actor, '127.0.0.1'
  );
  if operation_result->>'replayed' <> 'true' then
    raise exception 'idempotent replay was not recognized: %', operation_result;
  end if;

  begin
    perform public.cms_import_documents_atomic(
      'cms-smoke-operation-0001', repeat('b', 64), import_items, actor, null
    );
    raise exception 'operation identity conflict unexpectedly succeeded';
  exception when unique_violation then
    null;
  end;

  begin
    perform public.cms_import_documents_atomic(
      'cms-smoke-operation-atomic-failure', repeat('c', 64),
      import_items || jsonb_build_array(jsonb_build_object(
        'sourceId', 'broken', 'docType', 'knowledge', 'slug', '', 'locale', 'ru',
        'title', 'Некорректный материал', 'body', '{}'::jsonb, 'seo', '{}'::jsonb
      )),
      actor, null
    );
    raise exception 'invalid batch unexpectedly succeeded';
  exception when invalid_parameter_value then
    null;
  end;
  if exists (
    select 1 from public.cms_import_operations
    where operation_id = 'cms-smoke-operation-atomic-failure'
  ) then
    raise exception 'failed import left a partial operation ledger row';
  end if;

  if (select count(*) from public.admin_audit_log where entity_id = 'blog:atomic-workflow:ru') < 5 then
    raise exception 'atomic CMS audit trail is incomplete';
  end if;
end;
$$;

rollback;
