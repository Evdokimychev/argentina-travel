-- One transactional moderation decision for every shared moderation surface.
-- Lock order follows producer workflows: entity/related rows -> queue row.

alter table public.moderation_queue
  add column if not exists row_version bigint not null default 1;
alter table public.tourist_reviews
  add column if not exists row_version bigint not null default 1;
alter table public.review_reports
  add column if not exists row_version bigint not null default 1;
alter table public.forum_posts
  add column if not exists row_version bigint not null default 1;
alter table public.forum_post_reports
  add column if not exists row_version bigint not null default 1;

alter table public.moderation_queue drop constraint if exists moderation_queue_row_version_positive;
alter table public.moderation_queue add constraint moderation_queue_row_version_positive check (row_version > 0);
alter table public.tourist_reviews drop constraint if exists tourist_reviews_row_version_positive;
alter table public.tourist_reviews add constraint tourist_reviews_row_version_positive check (row_version > 0);
alter table public.review_reports drop constraint if exists review_reports_row_version_positive;
alter table public.review_reports add constraint review_reports_row_version_positive check (row_version > 0);
alter table public.forum_posts drop constraint if exists forum_posts_row_version_positive;
alter table public.forum_posts add constraint forum_posts_row_version_positive check (row_version > 0);
alter table public.forum_post_reports drop constraint if exists forum_post_reports_row_version_positive;
alter table public.forum_post_reports add constraint forum_post_reports_row_version_positive check (row_version > 0);

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.bump_moderation_row_version()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  if new.row_version = old.row_version then
    new.row_version := old.row_version + 1;
  end if;
  return new;
end;
$$;

drop trigger if exists moderation_queue_bump_row_version on public.moderation_queue;
create trigger moderation_queue_bump_row_version
  before update on public.moderation_queue
  for each row execute function private.bump_moderation_row_version();

drop trigger if exists tourist_reviews_bump_row_version on public.tourist_reviews;
create trigger tourist_reviews_bump_row_version
  before update on public.tourist_reviews
  for each row execute function private.bump_moderation_row_version();

drop trigger if exists review_reports_bump_row_version on public.review_reports;
create trigger review_reports_bump_row_version
  before update on public.review_reports
  for each row execute function private.bump_moderation_row_version();

drop trigger if exists forum_posts_bump_row_version on public.forum_posts;
create trigger forum_posts_bump_row_version
  before update on public.forum_posts
  for each row execute function private.bump_moderation_row_version();

drop trigger if exists forum_post_reports_bump_row_version on public.forum_post_reports;
create trigger forum_post_reports_bump_row_version
  before update on public.forum_post_reports
  for each row execute function private.bump_moderation_row_version();

create or replace function private.enqueue_forum_post_report_moderation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  thread_title text;
  category_slug text;
  category_title text;
  reason_label text;
begin
  select thread.title, category.slug, category.title
  into thread_title, category_slug, category_title
  from public.forum_posts post
  join public.forum_threads thread on thread.id = post.thread_id
  join public.forum_categories category on category.id = thread.category_id
  where post.id = new.post_id;

  reason_label := case new.reason
    when 'spam' then 'Спам'
    when 'offensive' then 'Оскорбления'
    when 'misinformation' then 'Недостоверная информация'
    when 'personal_data' then 'Персональные данные'
    else 'Другое'
  end;

  insert into public.moderation_queue (
    entity_type, entity_id, status, priority, submitted_by, reason, metadata
  ) values (
    'forum_post', new.post_id::text, 'pending', 10, new.reporter_user_id,
    'Жалоба на сообщение: ' || reason_label,
    jsonb_build_object(
      'reportId', new.id,
      'threadTitle', thread_title,
      'categorySlug', category_slug,
      'categoryTitle', category_title,
      'reason', new.reason,
      'reasonLabel', reason_label,
      'details', new.details
    )
  ) on conflict (entity_type, entity_id) do update
    set status = 'pending',
        priority = excluded.priority,
        submitted_by = excluded.submitted_by,
        reason = excluded.reason,
        metadata = excluded.metadata,
        assigned_to = null,
        resolved_at = null,
        resolved_by = null,
        updated_at = now();
  return new;
end;
$$;

revoke execute on function private.enqueue_forum_post_report_moderation()
  from public, anon, authenticated, service_role;

drop trigger if exists forum_post_reports_enqueue_moderation on public.forum_post_reports;
create trigger forum_post_reports_enqueue_moderation
  after insert on public.forum_post_reports
  for each row
  when (new.status = 'pending')
  execute function private.enqueue_forum_post_report_moderation();

create table if not exists public.moderation_delivery_outbox (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (
    entity_type in ('tour', 'review', 'review_report', 'forum_post', 'author_article')
  ),
  entity_id text not null,
  event_key text not null default 'moderation.resolved'
    check (event_key = 'moderation.resolved'),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'delivered', 'failed', 'dead')),
  payload jsonb not null default '{}'::jsonb,
  dedupe_key text not null unique check (length(dedupe_key) between 12 and 240),
  attempts integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not (payload ?| array[
    'email', 'phone', 'name', 'contactEmail', 'contactPhone', 'contactName',
    'reviewText', 'body', 'note', 'ipAddress', 'token', 'apiKey'
  ]))
);

create index if not exists moderation_delivery_outbox_retry_idx
  on public.moderation_delivery_outbox(next_attempt_at, created_at)
  where status in ('pending', 'failed');

drop trigger if exists moderation_delivery_outbox_set_updated_at on public.moderation_delivery_outbox;
create trigger moderation_delivery_outbox_set_updated_at
  before update on public.moderation_delivery_outbox
  for each row execute function public.set_updated_at();

alter table public.moderation_delivery_outbox enable row level security;
revoke all on public.moderation_delivery_outbox from public, anon, authenticated;
grant select, insert, update, delete on public.moderation_delivery_outbox to service_role;

create or replace function public.admin_resolve_moderation_item_atomic(
  p_queue_id uuid,
  p_action text,
  p_actor_user_id uuid,
  p_expected_queue_version bigint,
  p_expected_queue_status text,
  p_expected_entity_version bigint,
  p_expected_entity_status text,
  p_expected_related_version bigint default null,
  p_expected_related_status text default null,
  p_note text default null,
  p_ip_address text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  queue_hint record;
  queue_row public.moderation_queue%rowtype;
  tour_row public.tours%rowtype;
  review_row public.tourist_reviews%rowtype;
  report_row public.review_reports%rowtype;
  forum_post_row public.forum_posts%rowtype;
  forum_report_row public.forum_post_reports%rowtype;
  document_row public.content_documents%rowtype;
  revision_row public.content_revisions%rowtype;
  cms_result jsonb;
  submitted_revision_id uuid;
  forum_report_id uuid;
  next_queue_status text;
  next_entity_status text;
  next_entity_version bigint;
  next_related_status text;
  next_related_version bigint;
  entity_title text;
  owner_user_id text;
begin
  if p_action not in ('approve', 'reject') then
    return jsonb_build_object('ok', false, 'code', 'invalid_action');
  end if;
  if p_expected_queue_version is null or p_expected_queue_version < 1
    or p_expected_entity_version is null or p_expected_entity_version < 1
    or nullif(trim(p_expected_queue_status), '') is null
    or nullif(trim(p_expected_entity_status), '') is null
  then
    return jsonb_build_object('ok', false, 'code', 'expected_state_required');
  end if;
  if not public.admin_actor_has_capability(p_actor_user_id, 'marketplace.moderation') then
    return jsonb_build_object('ok', false, 'code', 'forbidden');
  end if;

  select entity_type, entity_id, metadata
  into queue_hint
  from public.moderation_queue
  where id = p_queue_id;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;
  if queue_hint.entity_type not in (
    'tour', 'review', 'review_report', 'forum_post', 'author_article'
  ) then
    return jsonb_build_object('ok', false, 'code', 'invalid_action');
  end if;

  -- Producers mutate the entity before enqueueing. Resolve in the same order to
  -- avoid entity/queue lock inversions under concurrent submit and moderation.
  if queue_hint.entity_type = 'tour' then
    select * into tour_row from public.tours
    where id = queue_hint.entity_id for update;
    if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
    if tour_row.row_version <> p_expected_entity_version
      or tour_row.moderation_status <> p_expected_entity_status
    then
      return jsonb_build_object(
        'ok', false, 'code', 'version_conflict',
        'actualEntityVersion', tour_row.row_version,
        'actualEntityStatus', tour_row.moderation_status
      );
    end if;
    if tour_row.moderation_status <> 'pending' then
      return jsonb_build_object('ok', false, 'code', 'invalid_transition');
    end if;
    entity_title := tour_row.title;
    owner_user_id := tour_row.owner_user_id;

  elsif queue_hint.entity_type = 'review' then
    select * into review_row from public.tourist_reviews
    where id = queue_hint.entity_id for update;
    if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
    if review_row.row_version <> p_expected_entity_version
      or review_row.status <> p_expected_entity_status
    then
      return jsonb_build_object(
        'ok', false, 'code', 'version_conflict',
        'actualEntityVersion', review_row.row_version,
        'actualEntityStatus', review_row.status
      );
    end if;
    if review_row.status <> 'pending' then
      return jsonb_build_object('ok', false, 'code', 'invalid_transition');
    end if;
    entity_title := review_row.tour_title;
    owner_user_id := review_row.user_id;

  elsif queue_hint.entity_type = 'review_report' then
    select * into report_row from public.review_reports
    where id = queue_hint.entity_id::uuid for update;
    if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
    select * into review_row from public.tourist_reviews
    where id = report_row.review_id for update;
    if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
    if p_expected_related_version is null or p_expected_related_version < 1
      or nullif(trim(p_expected_related_status), '') is null
    then
      return jsonb_build_object('ok', false, 'code', 'expected_state_required');
    end if;
    if report_row.row_version <> p_expected_entity_version
      or report_row.status <> p_expected_entity_status
      or review_row.row_version <> p_expected_related_version
      or review_row.status <> p_expected_related_status
    then
      return jsonb_build_object(
        'ok', false, 'code', 'version_conflict',
        'actualEntityVersion', report_row.row_version,
        'actualEntityStatus', report_row.status,
        'actualRelatedVersion', review_row.row_version,
        'actualRelatedStatus', review_row.status
      );
    end if;
    if report_row.status <> 'pending' then
      return jsonb_build_object('ok', false, 'code', 'invalid_transition');
    end if;
    entity_title := review_row.tour_title;

  elsif queue_hint.entity_type = 'forum_post' then
    begin
      forum_report_id := nullif(queue_hint.metadata->>'reportId', '')::uuid;
    exception when invalid_text_representation then
      return jsonb_build_object('ok', false, 'code', 'invalid_transition');
    end;
    if forum_report_id is null then
      return jsonb_build_object('ok', false, 'code', 'invalid_transition');
    end if;
    select * into forum_post_row from public.forum_posts
    where id = queue_hint.entity_id::uuid for update;
    if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
    select * into forum_report_row from public.forum_post_reports
    where id = forum_report_id and post_id = forum_post_row.id for update;
    if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
    if p_expected_related_version is null or p_expected_related_version < 1
      or nullif(trim(p_expected_related_status), '') is null
    then
      return jsonb_build_object('ok', false, 'code', 'expected_state_required');
    end if;
    if forum_post_row.row_version <> p_expected_entity_version
      or forum_post_row.status <> p_expected_entity_status
      or forum_report_row.row_version <> p_expected_related_version
      or forum_report_row.status <> p_expected_related_status
    then
      return jsonb_build_object(
        'ok', false, 'code', 'version_conflict',
        'actualEntityVersion', forum_post_row.row_version,
        'actualEntityStatus', forum_post_row.status,
        'actualRelatedVersion', forum_report_row.row_version,
        'actualRelatedStatus', forum_report_row.status
      );
    end if;
    if forum_report_row.status <> 'pending'
      or forum_post_row.status not in ('published', 'hidden')
    then
      return jsonb_build_object('ok', false, 'code', 'invalid_transition');
    end if;
    entity_title := coalesce(queue_hint.metadata->>'threadTitle', queue_hint.entity_id);
    owner_user_id := forum_post_row.author_id;

  else
    select * into document_row from public.content_documents
    where id = queue_hint.entity_id for update;
    if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
    if document_row.row_version <> p_expected_entity_version
      or document_row.status <> p_expected_entity_status
    then
      return jsonb_build_object(
        'ok', false, 'code', 'version_conflict',
        'actualEntityVersion', document_row.row_version,
        'actualEntityStatus', document_row.status
      );
    end if;
    if document_row.status <> 'draft' or document_row.body->>'kind' <> 'author_article' then
      return jsonb_build_object('ok', false, 'code', 'invalid_transition');
    end if;
    begin
      submitted_revision_id := nullif(queue_hint.metadata->>'submittedRevisionId', '')::uuid;
    exception when invalid_text_representation then
      return jsonb_build_object('ok', false, 'code', 'invalid_transition');
    end;
    if submitted_revision_id is null then
      return jsonb_build_object('ok', false, 'code', 'invalid_transition');
    end if;
    select * into revision_row from public.content_revisions
    where id = submitted_revision_id and document_id = document_row.id for update;
    if not found or revision_row.body->>'kind' <> 'author_article' then
      return jsonb_build_object('ok', false, 'code', 'invalid_transition');
    end if;
    entity_title := document_row.title;
    owner_user_id := document_row.created_by;
  end if;

  select * into queue_row
  from public.moderation_queue
  where id = p_queue_id
    and entity_type = queue_hint.entity_type
    and entity_id = queue_hint.entity_id
  for update;

  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if queue_row.row_version <> p_expected_queue_version
    or queue_row.status <> p_expected_queue_status
  then
    return jsonb_build_object(
      'ok', false, 'code', 'version_conflict',
      'actualQueueVersion', queue_row.row_version,
      'actualQueueStatus', queue_row.status
    );
  end if;
  if queue_row.status not in ('pending', 'in_review') then
    return jsonb_build_object('ok', false, 'code', 'invalid_transition');
  end if;

  next_queue_status := case when p_action = 'approve' then 'approved' else 'rejected' end;

  if queue_row.entity_type = 'tour' then
    update public.tours
    set moderation_status = case when p_action = 'approve' then 'approved' else 'rejected' end,
        moderation_notes = nullif(trim(p_note), ''),
        moderated_by = p_actor_user_id,
        moderated_at = now(),
        approved_listing = case when p_action = 'approve' then tour_row.listing else approved_listing end,
        approved_payload = case when p_action = 'approve' then tour_row.payload else approved_payload end,
        approved_at = case when p_action = 'approve' then now() else approved_at end,
        status = case
          when p_action = 'reject' and tour_row.approved_payload is null then 'draft'
          else status
        end,
        row_version = row_version + 1,
        updated_at = now()
    where id = tour_row.id and row_version = p_expected_entity_version
    returning moderation_status, row_version into next_entity_status, next_entity_version;

  elsif queue_row.entity_type = 'review' then
    update public.tourist_reviews
    set status = case when p_action = 'approve' then 'published' else 'rejected' end,
        moderation_notes = nullif(trim(p_note), ''),
        moderated_by = p_actor_user_id,
        moderated_at = now(),
        row_version = row_version + 1,
        updated_at = now()
    where id = review_row.id and row_version = p_expected_entity_version
    returning status, row_version into next_entity_status, next_entity_version;

  elsif queue_row.entity_type = 'review_report' then
    update public.review_reports
    set status = case when p_action = 'approve' then 'resolved' else 'dismissed' end,
        resolved_by = p_actor_user_id,
        resolved_at = now(),
        row_version = row_version + 1,
        updated_at = now()
    where id = report_row.id and row_version = p_expected_entity_version
    returning status, row_version into next_entity_status, next_entity_version;

    if p_action = 'approve' then
      update public.tourist_reviews
      set status = 'rejected',
          moderation_notes = 'Скрыт после подтверждения жалобы',
          moderated_by = p_actor_user_id,
          moderated_at = now(),
          row_version = row_version + 1,
          updated_at = now()
      where id = review_row.id and row_version = p_expected_related_version
      returning status, row_version into next_related_status, next_related_version;
    else
      next_related_status := review_row.status;
      next_related_version := review_row.row_version;
    end if;

  elsif queue_row.entity_type = 'forum_post' then
    if p_action = 'approve' and forum_post_row.status <> 'hidden' then
      update public.forum_posts
      set status = 'hidden', row_version = row_version + 1
      where id = forum_post_row.id and row_version = p_expected_entity_version
      returning status, row_version into next_entity_status, next_entity_version;
    else
      next_entity_status := forum_post_row.status;
      next_entity_version := forum_post_row.row_version;
    end if;

    update public.forum_post_reports
    set status = case when p_action = 'approve' then 'resolved' else 'dismissed' end,
        resolved_by = p_actor_user_id,
        resolved_at = now(),
        row_version = row_version + 1,
        updated_at = now()
    where id = forum_report_row.id and row_version = p_expected_related_version
    returning status, row_version into next_related_status, next_related_version;

  else
    cms_result := public.cms_mutate_document_atomic(
      p_document_id => document_row.id,
      p_expected_version => p_expected_entity_version::integer,
      p_actor_id => p_actor_user_id,
      p_operation => case when p_action = 'approve' then 'restore_publish' else 'update' end,
      p_allow_publish => true,
      p_target_status => case when p_action = 'reject' then 'draft' else null end,
      p_restore_revision_id => case when p_action = 'approve' then submitted_revision_id else null end,
      p_ip_address => p_ip_address
    );
    next_entity_status := cms_result->'document'->>'status';
    next_entity_version := (cms_result->'document'->>'row_version')::bigint;
    entity_title := coalesce(cms_result->'document'->>'title', entity_title);
  end if;

  if next_entity_version is null then
    raise exception using errcode = '40001', message = 'MODERATION_ENTITY_UPDATE_CONFLICT';
  end if;

  update public.moderation_queue
  set status = next_queue_status,
      reason = coalesce(nullif(trim(p_note), ''), queue_row.reason),
      resolved_by = p_actor_user_id,
      resolved_at = now(),
      row_version = row_version + 1,
      metadata = coalesce(queue_row.metadata, '{}'::jsonb) || jsonb_build_object(
        'resolution', jsonb_build_object(
          'action', p_action,
          'entityVersion', next_entity_version,
          'entityStatus', next_entity_status,
          'relatedVersion', next_related_version,
          'relatedStatus', next_related_status
        )
      )
  where id = queue_row.id and row_version = p_expected_queue_version
  returning * into queue_row;

  if not found then
    raise exception using errcode = '40001', message = 'MODERATION_QUEUE_UPDATE_CONFLICT';
  end if;

  insert into public.admin_audit_log (
    actor_user_id, action, entity_type, entity_id, payload, ip_address
  ) values (
    p_actor_user_id,
    'moderation.' || queue_row.entity_type || '.' || p_action,
    queue_row.entity_type,
    queue_row.entity_id,
    jsonb_build_object(
      'queueId', queue_row.id,
      'queueVersion', queue_row.row_version,
      'fromQueueStatus', p_expected_queue_status,
      'toQueueStatus', queue_row.status,
      'fromEntityStatus', p_expected_entity_status,
      'toEntityStatus', next_entity_status,
      'entityVersion', next_entity_version,
      'hasNote', nullif(trim(p_note), '') is not null
    ),
    nullif(trim(p_ip_address), '')
  );

  insert into public.moderation_delivery_outbox (
    entity_type, entity_id, payload, dedupe_key
  ) values (
    queue_row.entity_type,
    queue_row.entity_id,
    jsonb_build_object(
      'action', p_action,
      'queueId', queue_row.id,
      'queueVersion', queue_row.row_version,
      'entityVersion', next_entity_version,
      'entityStatus', next_entity_status,
      'hasRecipient', owner_user_id is not null
    ),
    'moderation:' || queue_row.id::text || ':' || queue_row.row_version::text
  );

  return jsonb_build_object(
    'ok', true,
    'entityType', queue_row.entity_type,
    'entityId', queue_row.entity_id,
    'entityTitle', entity_title,
    'ownerUserId', owner_user_id,
    'queueVersion', queue_row.row_version,
    'queueStatus', queue_row.status,
    'entityVersion', next_entity_version,
    'entityStatus', next_entity_status,
    'relatedVersion', next_related_version,
    'relatedStatus', next_related_status
  );
end;
$$;

revoke all on function public.admin_resolve_moderation_item_atomic(
  uuid, text, uuid, bigint, text, bigint, text, bigint, text, text, text
) from public, anon, authenticated;
grant execute on function public.admin_resolve_moderation_item_atomic(
  uuid, text, uuid, bigint, text, bigint, text, bigint, text, text, text
) to service_role;

comment on function public.admin_resolve_moderation_item_atomic(
  uuid, text, uuid, bigint, text, bigint, text, bigint, text, text, text
) is 'Atomic CAS moderation for tours, reviews, review reports, forum reports and author articles.';
comment on table public.moderation_delivery_outbox is
  'PII-free durable delivery intent. Business truth is already committed before workers deliver notifications.';
