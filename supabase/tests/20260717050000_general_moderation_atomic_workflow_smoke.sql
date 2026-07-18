\set ON_ERROR_STOP on

begin;

do $$
declare
  admin_id constant uuid := '50000000-0000-4000-8000-000000000001';
  owner_id constant uuid := '50000000-0000-4000-8000-000000000002';
  reporter_id constant uuid := '50000000-0000-4000-8000-000000000003';
  category_id uuid;
  thread_id uuid;
  post_id uuid;
  forum_report_id uuid;
  review_report_id uuid;
  author_revision_id uuid;
  queue_row public.moderation_queue%rowtype;
  result jsonb;
begin
  insert into auth.users(id, email, raw_user_meta_data)
  values
    (admin_id, 'moderation-admin@example.invalid', '{}'::jsonb),
    (owner_id, 'moderation-owner@example.invalid', '{}'::jsonb),
    (reporter_id, 'moderation-reporter@example.invalid', '{}'::jsonb);
  insert into public.admin_staff(user_id, preset, capabilities, is_active)
  values (admin_id, 'marketplace_manager', array['marketplace.moderation']::text[], true);
  update public.profiles
  set roles = array['admin']::text[], active_role = 'admin'
  where id = admin_id;

  if has_function_privilege(
    'authenticated',
    'public.admin_resolve_moderation_item_atomic(uuid,text,uuid,bigint,text,bigint,text,bigint,text,text,text)',
    'EXECUTE'
  ) then
    raise exception 'authenticated unexpectedly has moderation resolver privilege';
  end if;

  -- Tour: entity and queue change together, with immutable approved snapshot.
  insert into public.tours (
    id, market_code, slug, owner_user_id, status, title, listing, payload,
    product_type, moderation_status, published_at
  ) values (
    'moderation-tour', 'ar', 'moderation-tour', owner_id::text, 'published',
    'Тур для атомарной модерации', '{"title":"Тур для атомарной модерации"}'::jsonb,
    '{"id":"moderation-tour","title":"Тур для атомарной модерации"}'::jsonb,
    'tour', 'pending', now()
  );
  select * into queue_row from public.moderation_queue
  where entity_type = 'tour' and entity_id = 'moderation-tour';
  result := public.admin_resolve_moderation_item_atomic(
    queue_row.id, 'approve', admin_id, queue_row.row_version, queue_row.status,
    (select row_version from public.tours where id = 'moderation-tour'),
    'pending', null, null, 'Проверено', '127.0.0.1'
  );
  if result->>'ok' <> 'true'
    or (select moderation_status from public.tours where id = 'moderation-tour') <> 'approved'
    or (select status from public.moderation_queue where id = queue_row.id) <> 'approved'
    or (select approved_payload from public.tours where id = 'moderation-tour') is null
  then raise exception 'tour decision was not atomic: %', result; end if;

  -- Review: stale replay is rejected without changing the committed decision.
  insert into public.tourist_reviews (
    id, user_id, tour_id, tour_slug, tour_title, rating, review_text, status
  ) values (
    'moderation-review', owner_id, 'moderation-tour', 'moderation-tour',
    'Тур для атомарной модерации', 5, 'Проверенный отзыв для сценария модерации', 'pending'
  );
  select * into queue_row from public.moderation_queue
  where entity_type = 'review' and entity_id = 'moderation-review';
  result := public.admin_resolve_moderation_item_atomic(
    queue_row.id, 'approve', admin_id, queue_row.row_version, queue_row.status,
    (select row_version from public.tourist_reviews where id = 'moderation-review'),
    'pending', null, null, null, null
  );
  if result->>'ok' <> 'true'
    or (select status from public.tourist_reviews where id = 'moderation-review') <> 'published'
  then raise exception 'review decision failed: %', result; end if;
  result := public.admin_resolve_moderation_item_atomic(
    queue_row.id, 'reject', admin_id, queue_row.row_version, queue_row.status,
    1, 'pending', null, null, null, null
  );
  if result->>'code' <> 'version_conflict'
    or (select status from public.tourist_reviews where id = 'moderation-review') <> 'published'
  then raise exception 'stale review replay was not fail-closed: %', result; end if;

  -- Review complaint: complaint and reviewed content resolve in one call.
  insert into public.tourist_reviews (
    id, user_id, tour_id, tour_slug, tour_title, rating, review_text, status
  ) values (
    'moderation-reported-review', owner_id, 'moderation-tour', 'moderation-tour',
    'Тур для жалобы', 1, 'Публичный отзыв для проверки жалобы', 'published'
  );
  insert into public.review_reports(review_id, reporter_user_id, reason, details)
  values ('moderation-reported-review', reporter_id, 'fake', 'Проверка сценария')
  returning id into review_report_id;
  select * into queue_row from public.moderation_queue
  where entity_type = 'review_report' and entity_id = review_report_id::text;
  result := public.admin_resolve_moderation_item_atomic(
    queue_row.id, 'approve', admin_id, queue_row.row_version, queue_row.status,
    (select row_version from public.review_reports where id = review_report_id), 'pending',
    (select row_version from public.tourist_reviews where id = 'moderation-reported-review'),
    'published', null, null
  );
  if result->>'ok' <> 'true'
    or (select status from public.review_reports where id = review_report_id) <> 'resolved'
    or (select status from public.tourist_reviews where id = 'moderation-reported-review') <> 'rejected'
  then raise exception 'review complaint decision failed: %', result; end if;

  -- Forum complaint: report metadata identifies the related row, both are CAS checked.
  insert into public.forum_categories(slug, title)
  values ('moderation-smoke', 'Модерация') returning id into category_id;
  insert into public.forum_threads(category_id, author_id, title)
  values (category_id, owner_id, 'Тема модерации') returning id into thread_id;
  insert into public.forum_posts(thread_id, author_id, body)
  values (thread_id, owner_id, 'Сообщение для проверки атомарной жалобы') returning id into post_id;
  insert into public.forum_post_reports(post_id, reporter_user_id, reason, details)
  values (post_id, reporter_id, 'spam', 'Проверка') returning id into forum_report_id;
  select * into queue_row from public.moderation_queue
  where entity_type = 'forum_post' and entity_id = post_id::text;
  result := public.admin_resolve_moderation_item_atomic(
    queue_row.id, 'approve', admin_id, queue_row.row_version, queue_row.status,
    (select row_version from public.forum_posts where id = post_id), 'published',
    (select row_version from public.forum_post_reports where id = forum_report_id),
    'pending', null, null
  );
  if result->>'ok' <> 'true'
    or (select status from public.forum_posts where id = post_id) <> 'hidden'
    or (select status from public.forum_post_reports where id = forum_report_id) <> 'resolved'
  then raise exception 'forum complaint decision failed: %', result; end if;

  -- Author article: publish the exact submitted revision through the CMS RPC.
  result := public.cms_create_document_atomic(
    'author_article:moderation-smoke:ru', 'blog', 'moderation-smoke', 'ru',
    'Авторская статья для модерации',
    '{"kind":"author_article","articleType":"story","sections":[{"title":"Раздел","body":"Проверенный материал"}]}'::jsonb,
    '{}'::jsonb, 'draft', owner_id, false, null
  );
  select id into author_revision_id from public.content_revisions
  where document_id = 'author_article:moderation-smoke:ru'
  order by revision_number desc limit 1;
  insert into public.moderation_queue(entity_type, entity_id, status, submitted_by, metadata)
  values (
    'author_article', 'author_article:moderation-smoke:ru', 'pending', owner_id,
    jsonb_build_object('submittedRevisionId', author_revision_id, 'title', 'Авторская статья')
  ) returning * into queue_row;
  result := public.admin_resolve_moderation_item_atomic(
    queue_row.id, 'approve', admin_id, queue_row.row_version, queue_row.status,
    (select row_version from public.content_documents where id = 'author_article:moderation-smoke:ru'),
    'draft', null, null, 'Можно публиковать', null
  );
  if result->>'ok' <> 'true'
    or (select status from public.content_documents where id = 'author_article:moderation-smoke:ru') <> 'published'
    or not exists (
      select 1 from public.cms_search_outbox
      where document_id = 'author_article:moderation-smoke:ru' and intent = 'upsert'
    )
  then raise exception 'author article decision failed: %', result; end if;

  if (select count(*) from public.moderation_delivery_outbox) <> 5 then
    raise exception 'expected one durable moderation intent per committed decision';
  end if;
  if (select count(*) from public.admin_audit_log
      where actor_user_id = admin_id and action like 'moderation.%') <> 5 then
    raise exception 'expected one moderation audit event per committed decision';
  end if;
  if exists (
    select 1 from public.moderation_delivery_outbox
    where payload ?| array['email', 'phone', 'name', 'reviewText', 'body', 'note', 'ipAddress']
  ) then raise exception 'PII leaked into moderation delivery outbox'; end if;
end;
$$;

rollback;
