-- Blog comment complaints in the unified moderation queue.
-- Inserts enqueue atomically; moderation decisions use expected-state CAS.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- A comment author must not be able to publish a comment after moderation hid it.
drop policy if exists "blog_article_comments_update_author" on public.blog_article_comments;
create policy "blog_article_comments_update_author"
  on public.blog_article_comments for update
  to authenticated
  using (
    user_id = (select auth.uid())
    and status in ('pending', 'published')
  )
  with check (
    user_id = (select auth.uid())
    and status in ('pending', 'published')
  );

create or replace function private.enqueue_blog_comment_report()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.moderation_queue (
    entity_type,
    entity_id,
    status,
    priority,
    submitted_by,
    reason,
    metadata
  )
  values (
    'blog_comment_report',
    new.id::text,
    'pending',
    10,
    new.reporter_user_id,
    'Жалоба на комментарий блога',
    jsonb_build_object(
      'commentId', new.comment_id,
      'reason', new.reason,
      'reportCreatedAt', new.created_at
    )
  )
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

  return new;
end;
$$;

revoke execute on function private.enqueue_blog_comment_report() from public, anon, authenticated, service_role;

drop trigger if exists blog_comment_reports_enqueue_moderation on public.blog_comment_reports;
create trigger blog_comment_reports_enqueue_moderation
  after insert on public.blog_comment_reports
  for each row execute function private.enqueue_blog_comment_report();

-- Existing unresolved complaints become visible without a write from admin GET.
insert into public.moderation_queue (
  entity_type,
  entity_id,
  status,
  priority,
  submitted_by,
  reason,
  metadata
)
select
  'blog_comment_report',
  report.id::text,
  'pending',
  10,
  report.reporter_user_id,
  'Жалоба на комментарий блога',
  jsonb_build_object(
    'commentId', report.comment_id,
    'reason', report.reason,
    'reportCreatedAt', report.created_at
  )
from public.blog_comment_reports report
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

create or replace function public.admin_resolve_blog_comment_report(
  p_queue_id uuid,
  p_report_id uuid,
  p_actor_id uuid,
  p_action text,
  p_expected_queue_status text,
  p_expected_report_status text,
  p_expected_comment_status text,
  p_note text default null,
  p_ip_address text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  queue_row public.moderation_queue%rowtype;
  report_row public.blog_comment_reports%rowtype;
  comment_row public.blog_article_comments%rowtype;
  next_queue_status text;
  next_report_status text;
  next_comment_status text;
begin
  if p_action not in ('hide_comment', 'restore_comment', 'dismiss_report') then
    return jsonb_build_object('ok', false, 'code', 'invalid_action');
  end if;

  if p_expected_queue_status is null
    or p_expected_report_status is null
    or p_expected_comment_status is null then
    return jsonb_build_object('ok', false, 'code', 'expected_state_required');
  end if;

  if not exists (
    select 1
    from public.profiles profile
    where profile.id = p_actor_id
      and profile.roles @> array['admin']::text[]
      and not coalesce(profile.is_blocked, false)
      and (
        not exists (
          select 1 from public.admin_staff staff where staff.user_id = profile.id
        )
        or exists (
          select 1
          from public.admin_staff staff
          where staff.user_id = profile.id
            and staff.is_active = true
            and (
              '*' = any(staff.capabilities)
              or 'marketplace.moderation' = any(staff.capabilities)
            )
        )
      )
  ) then
    return jsonb_build_object('ok', false, 'code', 'forbidden');
  end if;

  -- Every resolver locks in queue -> report -> comment order.
  select * into queue_row
  from public.moderation_queue
  where id = p_queue_id
    and entity_type = 'blog_comment_report'
    and entity_id = p_report_id::text
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  select * into report_row
  from public.blog_comment_reports
  where id = p_report_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  select * into comment_row
  from public.blog_article_comments
  where id = report_row.comment_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  if queue_row.status <> p_expected_queue_status
    or report_row.status <> p_expected_report_status
    or comment_row.status <> p_expected_comment_status then
    return jsonb_build_object(
      'ok', false,
      'code', 'version_conflict',
      'actualQueueStatus', queue_row.status,
      'actualReportStatus', report_row.status,
      'actualCommentStatus', comment_row.status
    );
  end if;

  if p_action = 'restore_comment' then
    if not (
      (queue_row.status in ('pending', 'in_review') and report_row.status = 'pending')
      or (queue_row.status = 'approved' and report_row.status = 'resolved')
    ) then
      return jsonb_build_object(
        'ok', false,
        'code', 'version_conflict',
        'actualQueueStatus', queue_row.status,
        'actualReportStatus', report_row.status,
        'actualCommentStatus', comment_row.status
      );
    end if;
  elsif queue_row.status not in ('pending', 'in_review') or report_row.status <> 'pending' then
    return jsonb_build_object(
      'ok', false,
      'code', 'version_conflict',
      'actualQueueStatus', queue_row.status,
      'actualReportStatus', report_row.status,
      'actualCommentStatus', comment_row.status
    );
  end if;

  if p_action = 'hide_comment' and comment_row.status not in ('pending', 'published') then
    return jsonb_build_object('ok', false, 'code', 'invalid_transition');
  end if;
  if p_action = 'restore_comment' and comment_row.status <> 'hidden' then
    return jsonb_build_object('ok', false, 'code', 'invalid_transition');
  end if;

  next_comment_status := case
    when p_action = 'hide_comment' then 'hidden'
    when p_action = 'restore_comment' then 'published'
    else comment_row.status
  end;
  next_report_status := case when p_action = 'hide_comment' then 'resolved' else 'dismissed' end;
  next_queue_status := case when p_action = 'hide_comment' then 'approved' else 'rejected' end;

  if next_comment_status <> comment_row.status then
    update public.blog_article_comments
    set status = next_comment_status,
        updated_at = now()
    where id = comment_row.id
      and status = p_expected_comment_status;
  end if;

  update public.blog_comment_reports
  set status = next_report_status,
      resolved_by = p_actor_id,
      resolved_at = now(),
      updated_at = now()
  where id = report_row.id
    and status = p_expected_report_status;

  update public.moderation_queue
  set status = next_queue_status,
      reason = coalesce(nullif(trim(p_note), ''), queue_row.reason),
      metadata = coalesce(queue_row.metadata, '{}'::jsonb) || jsonb_build_object(
        'resolution', jsonb_build_object(
          'action', p_action,
          'previousCommentStatus', comment_row.status,
          'nextCommentStatus', next_comment_status,
          'previousReportStatus', report_row.status,
          'nextReportStatus', next_report_status
        )
      ),
      resolved_by = p_actor_id,
      resolved_at = now(),
      updated_at = now()
  where id = queue_row.id
    and status = p_expected_queue_status;

  insert into public.admin_audit_log (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    payload,
    ip_address
  )
  values (
    p_actor_id,
    'moderation.blog_comment_report.' || p_action,
    'blog_comment_report',
    p_report_id::text,
    jsonb_build_object(
      'queueId', p_queue_id,
      'note', nullif(trim(p_note), ''),
      'previousCommentStatus', comment_row.status,
      'nextCommentStatus', next_comment_status,
      'previousReportStatus', report_row.status,
      'nextReportStatus', next_report_status
    ),
    nullif(trim(p_ip_address), '')
  );

  return jsonb_build_object(
    'ok', true,
    'queueStatus', next_queue_status,
    'reportStatus', next_report_status,
    'commentStatus', next_comment_status
  );
end;
$$;

revoke execute on function public.admin_resolve_blog_comment_report(
  uuid, uuid, uuid, text, text, text, text, text, text
) from public, anon, authenticated;
grant execute on function public.admin_resolve_blog_comment_report(
  uuid, uuid, uuid, text, text, text, text, text, text
) to service_role;

comment on function public.admin_resolve_blog_comment_report(
  uuid, uuid, uuid, text, text, text, text, text, text
) is 'Atomic CAS resolution for blog comment complaints; service_role only';
