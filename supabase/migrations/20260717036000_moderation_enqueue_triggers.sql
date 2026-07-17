-- Moderation jobs are created in the same transaction as a tour/review/report.
-- Admin GET routes must never repair or mutate queues as a side effect.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.safe_uuid(value text)
returns uuid
language sql
immutable
strict
set search_path = ''
as $$
  select case
    when value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then value::uuid
    else null::uuid
  end
$$;

revoke execute on function private.safe_uuid(text) from public, anon, authenticated, service_role;

create or replace function private.enqueue_tour_moderation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.moderation_status <> 'pending' then return new; end if;

  insert into public.moderation_queue (
    entity_type, entity_id, status, priority, submitted_by, reason, metadata
  ) values (
    'tour',
    new.id::text,
    'pending',
    0,
    private.safe_uuid(new.owner_user_id),
    case when new.product_type = 'excursion'
      then 'Публикация экскурсии организатором'
      else 'Публикация тура организатором'
    end,
    jsonb_build_object(
      'slug', new.slug,
      'title', new.title,
      'ownerUserId', new.owner_user_id,
      'productType', new.product_type
    )
  ) on conflict (entity_type, entity_id) do update
    set status = 'pending',
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

revoke execute on function private.enqueue_tour_moderation() from public, anon, authenticated, service_role;

drop trigger if exists tours_enqueue_moderation on public.tours;
create trigger tours_enqueue_moderation
  after insert or update of moderation_status on public.tours
  for each row
  when (new.moderation_status = 'pending')
  execute function private.enqueue_tour_moderation();

create or replace function private.enqueue_tourist_review_moderation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status <> 'pending' then return new; end if;

  insert into public.moderation_queue (
    entity_type, entity_id, status, priority, submitted_by, reason, metadata
  ) values (
    'review',
    new.id::text,
    'pending',
    0,
    new.user_id,
    'Публикация отзыва туристом',
    jsonb_build_object(
      'tourTitle', new.tour_title,
      'tourSlug', new.tour_slug,
      'rating', new.rating,
      'authorUserId', new.user_id
    )
  ) on conflict (entity_type, entity_id) do update
    set status = 'pending',
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

revoke execute on function private.enqueue_tourist_review_moderation() from public, anon, authenticated, service_role;

drop trigger if exists tourist_reviews_enqueue_moderation on public.tourist_reviews;
create trigger tourist_reviews_enqueue_moderation
  after insert or update of status on public.tourist_reviews
  for each row
  when (new.status = 'pending')
  execute function private.enqueue_tourist_review_moderation();

create or replace function private.enqueue_review_report_moderation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status <> 'pending' then return new; end if;

  insert into public.moderation_queue (
    entity_type, entity_id, status, priority, submitted_by, reason, metadata
  ) values (
    'review_report',
    new.id::text,
    'pending',
    10,
    new.reporter_user_id,
    'Жалоба на отзыв',
    jsonb_build_object('reviewId', new.review_id, 'reason', new.reason)
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

revoke execute on function private.enqueue_review_report_moderation() from public, anon, authenticated, service_role;

drop trigger if exists review_reports_enqueue_moderation on public.review_reports;
create trigger review_reports_enqueue_moderation
  after insert on public.review_reports
  for each row
  when (new.status = 'pending')
  execute function private.enqueue_review_report_moderation();

-- Backfill once so the first read after deployment is complete and read-only.
insert into public.moderation_queue (
  entity_type, entity_id, status, priority, submitted_by, reason, metadata
)
select
  'tour', tour.id::text, 'pending', 0, private.safe_uuid(tour.owner_user_id),
  case when tour.product_type = 'excursion'
    then 'Публикация экскурсии организатором'
    else 'Публикация тура организатором'
  end,
  jsonb_build_object(
    'slug', tour.slug,
    'title', tour.title,
    'ownerUserId', tour.owner_user_id,
    'productType', tour.product_type
  )
from public.tours tour
where tour.moderation_status = 'pending'
on conflict (entity_type, entity_id) do update
set status = 'pending',
    submitted_by = excluded.submitted_by,
    reason = excluded.reason,
    metadata = excluded.metadata,
    assigned_to = null,
    resolved_at = null,
    resolved_by = null,
    updated_at = now();

insert into public.moderation_queue (
  entity_type, entity_id, status, priority, submitted_by, reason, metadata
)
select
  'review', review.id::text, 'pending', 0, review.user_id,
  'Публикация отзыва туристом',
  jsonb_build_object(
    'tourTitle', review.tour_title,
    'tourSlug', review.tour_slug,
    'rating', review.rating,
    'authorUserId', review.user_id
  )
from public.tourist_reviews review
where review.status = 'pending'
on conflict (entity_type, entity_id) do update
set status = 'pending',
    submitted_by = excluded.submitted_by,
    reason = excluded.reason,
    metadata = excluded.metadata,
    assigned_to = null,
    resolved_at = null,
    resolved_by = null,
    updated_at = now();

insert into public.moderation_queue (
  entity_type, entity_id, status, priority, submitted_by, reason, metadata
)
select
  'review_report', report.id::text, 'pending', 10, report.reporter_user_id,
  'Жалоба на отзыв',
  jsonb_build_object('reviewId', report.review_id, 'reason', report.reason)
from public.review_reports report
where report.status = 'pending'
on conflict (entity_type, entity_id) do update
set status = 'pending',
    priority = excluded.priority,
    submitted_by = excluded.submitted_by,
    reason = excluded.reason,
    metadata = excluded.metadata,
    assigned_to = null,
    resolved_at = null,
    resolved_by = null,
    updated_at = now();

comment on function private.enqueue_tour_moderation() is
  'Trigger-only atomic enqueue for native tour and excursion moderation';
comment on function private.enqueue_tourist_review_moderation() is
  'Trigger-only atomic enqueue for tourist review moderation';
comment on function private.enqueue_review_report_moderation() is
  'Trigger-only atomic enqueue for review complaints without copying report details';
