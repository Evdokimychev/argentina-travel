-- Professional forum ownership controls: category lifecycle and atomic thread state changes.

alter table public.forum_categories
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists forum_categories_active_sort_idx
  on public.forum_categories (is_active, sort_order, title);

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.touch_forum_category_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at := greatest(clock_timestamp(), old.updated_at + interval '1 microsecond');
  return new;
end;
$$;

revoke execute on function private.touch_forum_category_updated_at()
  from public, anon, authenticated, service_role;

drop trigger if exists forum_categories_set_updated_at on public.forum_categories;
create trigger forum_categories_set_updated_at
  before update on public.forum_categories
  for each row execute function private.touch_forum_category_updated_at();

create or replace function private.admin_forum_actor_allowed(p_actor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.profiles profile
    join public.admin_staff staff on staff.user_id = profile.id
    where profile.id = p_actor_id
      and profile.roles @> array['admin']::text[]
      and not coalesce(profile.is_blocked, false)
      and staff.is_active = true
      and (
        '*' = any(staff.capabilities)
        or 'marketplace.moderation' = any(staff.capabilities)
      )
  );
$$;

revoke execute on function private.admin_forum_actor_allowed(uuid)
  from public, anon, authenticated, service_role;

create or replace function public.admin_manage_forum_category(
  p_action text,
  p_actor_id uuid,
  p_category_id uuid,
  p_expected_updated_at timestamptz,
  p_slug text,
  p_title text,
  p_description text,
  p_sort_order integer,
  p_public_read boolean,
  p_is_active boolean,
  p_ip_address text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  category_row public.forum_categories%rowtype;
  normalized_title text := trim(coalesce(p_title, ''));
  normalized_description text := nullif(trim(coalesce(p_description, '')), '');
  normalized_slug text := lower(trim(coalesce(p_slug, '')));
  thread_count bigint;
begin
  if not private.admin_forum_actor_allowed(p_actor_id) then
    return jsonb_build_object('ok', false, 'code', 'forbidden');
  end if;

  if p_action not in ('create', 'update', 'delete') then
    return jsonb_build_object('ok', false, 'code', 'invalid_action');
  end if;

  if p_action = 'create' then
    if char_length(normalized_title) < 2 or char_length(normalized_title) > 100
      or normalized_slug !~ '^[a-z0-9][a-z0-9-]{1,79}$'
      or char_length(coalesce(normalized_description, '')) > 1000
      or p_sort_order is null or p_sort_order < 0 or p_sort_order > 32767
      or p_public_read is null or p_is_active is null then
      return jsonb_build_object('ok', false, 'code', 'invalid_input');
    end if;

    begin
      insert into public.forum_categories (
        slug, title, description, public_read, sort_order, is_active
      )
      values (
        normalized_slug,
        normalized_title,
        normalized_description,
        p_public_read,
        p_sort_order::smallint,
        p_is_active
      )
      returning * into category_row;
    exception when unique_violation then
      return jsonb_build_object('ok', false, 'code', 'slug_conflict');
    end;

    insert into public.admin_audit_log (
      actor_user_id, action, entity_type, entity_id, payload, ip_address
    )
    values (
      p_actor_id,
      'forum.category.create',
      'forum_category',
      category_row.id::text,
      jsonb_build_object(
        'title', category_row.title,
        'slug', category_row.slug,
        'sortOrder', category_row.sort_order,
        'publicRead', category_row.public_read,
        'isActive', category_row.is_active
      ),
      nullif(trim(coalesce(p_ip_address, '')), '')
    );

    return jsonb_build_object('ok', true, 'category', to_jsonb(category_row));
  end if;

  if p_category_id is null or p_expected_updated_at is null then
    return jsonb_build_object('ok', false, 'code', 'invalid_input');
  end if;

  select * into category_row
  from public.forum_categories
  where id = p_category_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  if category_row.updated_at is distinct from p_expected_updated_at then
    return jsonb_build_object(
      'ok', false,
      'code', 'version_conflict',
      'actualUpdatedAt', category_row.updated_at
    );
  end if;

  if p_action = 'delete' then
    select count(*) into thread_count
    from public.forum_threads
    where category_id = category_row.id;

    if thread_count > 0 then
      return jsonb_build_object(
        'ok', false,
        'code', 'category_not_empty',
        'threadCount', thread_count
      );
    end if;

    delete from public.forum_categories where id = category_row.id;

    insert into public.admin_audit_log (
      actor_user_id, action, entity_type, entity_id, payload, ip_address
    )
    values (
      p_actor_id,
      'forum.category.delete',
      'forum_category',
      category_row.id::text,
      jsonb_build_object('title', category_row.title, 'slug', category_row.slug),
      nullif(trim(coalesce(p_ip_address, '')), '')
    );

    return jsonb_build_object('ok', true, 'deletedId', category_row.id);
  end if;

  if char_length(normalized_title) < 2 or char_length(normalized_title) > 100
    or char_length(coalesce(normalized_description, '')) > 1000
    or p_sort_order is null or p_sort_order < 0 or p_sort_order > 32767
    or p_public_read is null or p_is_active is null then
    return jsonb_build_object('ok', false, 'code', 'invalid_input');
  end if;

  update public.forum_categories
  set title = normalized_title,
      description = normalized_description,
      public_read = p_public_read,
      sort_order = p_sort_order::smallint,
      is_active = p_is_active,
      updated_at = clock_timestamp()
  where id = category_row.id
  returning * into category_row;

  insert into public.admin_audit_log (
    actor_user_id, action, entity_type, entity_id, payload, ip_address
  )
  values (
    p_actor_id,
    'forum.category.update',
    'forum_category',
    category_row.id::text,
    jsonb_build_object(
      'title', category_row.title,
      'sortOrder', category_row.sort_order,
      'publicRead', category_row.public_read,
      'isActive', category_row.is_active
    ),
    nullif(trim(coalesce(p_ip_address, '')), '')
  );

  return jsonb_build_object('ok', true, 'category', to_jsonb(category_row));
end;
$$;

revoke execute on function public.admin_manage_forum_category(
  text, uuid, uuid, timestamptz, text, text, text, integer, boolean, boolean, text
) from public, anon, authenticated;
grant execute on function public.admin_manage_forum_category(
  text, uuid, uuid, timestamptz, text, text, text, integer, boolean, boolean, text
) to service_role;

create or replace function public.admin_set_forum_thread_state(
  p_thread_id uuid,
  p_actor_id uuid,
  p_expected_pinned boolean,
  p_expected_locked boolean,
  p_next_pinned boolean,
  p_next_locked boolean,
  p_ip_address text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  thread_row public.forum_threads%rowtype;
begin
  if not private.admin_forum_actor_allowed(p_actor_id) then
    return jsonb_build_object('ok', false, 'code', 'forbidden');
  end if;

  if p_thread_id is null or p_expected_pinned is null or p_expected_locked is null
    or p_next_pinned is null or p_next_locked is null then
    return jsonb_build_object('ok', false, 'code', 'invalid_input');
  end if;

  select * into thread_row
  from public.forum_threads
  where id = p_thread_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  if thread_row.pinned is distinct from p_expected_pinned
    or thread_row.locked is distinct from p_expected_locked then
    return jsonb_build_object(
      'ok', false,
      'code', 'version_conflict',
      'actualPinned', thread_row.pinned,
      'actualLocked', thread_row.locked
    );
  end if;

  if thread_row.pinned = p_next_pinned and thread_row.locked = p_next_locked then
    return jsonb_build_object('ok', false, 'code', 'no_change');
  end if;

  update public.forum_threads
  set pinned = p_next_pinned,
      locked = p_next_locked,
      updated_at = clock_timestamp()
  where id = thread_row.id
  returning * into thread_row;

  insert into public.admin_audit_log (
    actor_user_id, action, entity_type, entity_id, payload, ip_address
  )
  values (
    p_actor_id,
    'forum.thread.state.update',
    'forum_thread',
    thread_row.id::text,
    jsonb_build_object(
      'previousPinned', p_expected_pinned,
      'nextPinned', thread_row.pinned,
      'previousLocked', p_expected_locked,
      'nextLocked', thread_row.locked
    ),
    nullif(trim(coalesce(p_ip_address, '')), '')
  );

  return jsonb_build_object(
    'ok', true,
    'thread', jsonb_build_object(
      'id', thread_row.id,
      'pinned', thread_row.pinned,
      'locked', thread_row.locked,
      'updated_at', thread_row.updated_at
    )
  );
end;
$$;

revoke execute on function public.admin_set_forum_thread_state(
  uuid, uuid, boolean, boolean, boolean, boolean, text
) from public, anon, authenticated;
grant execute on function public.admin_set_forum_thread_state(
  uuid, uuid, boolean, boolean, boolean, boolean, text
) to service_role;

-- All category and thread management must pass through the audited server RPCs.
-- Public authors currently have no thread-editing UI; removing the broad author
-- update policy also prevents a direct Data API call from self-pinning or locking.
drop policy if exists "forum_categories_staff_all" on public.forum_categories;
drop policy if exists "forum_threads_update_author" on public.forum_threads;
drop policy if exists "forum_threads_staff_all" on public.forum_threads;

-- Inactive categories are absent from public reads and cannot receive new content.
drop policy if exists "forum_categories_select_anon" on public.forum_categories;
create policy "forum_categories_select_anon"
  on public.forum_categories for select
  to anon
  using (is_active = true and public_read = true);

drop policy if exists "forum_categories_select_authenticated" on public.forum_categories;
create policy "forum_categories_select_authenticated"
  on public.forum_categories for select
  to authenticated
  using (is_active = true or public.is_admin_with('dashboard.view'));

drop policy if exists "forum_threads_select" on public.forum_threads;
create policy "forum_threads_select"
  on public.forum_threads for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.forum_categories category
      where category.id = category_id
        and category.is_active = true
        and (category.public_read = true or (select auth.uid()) is not null)
    )
    or public.is_admin_with('dashboard.view')
  );

drop policy if exists "forum_threads_insert_authenticated" on public.forum_threads;
create policy "forum_threads_insert_authenticated"
  on public.forum_threads for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and pinned = false
    and locked = false
    and exists (
      select 1 from public.forum_categories category
      where category.id = category_id
        and category.is_active = true
        and (category.public_read = true or (select auth.uid()) is not null)
    )
  );

drop policy if exists "forum_posts_select" on public.forum_posts;
create policy "forum_posts_select"
  on public.forum_posts for select
  to anon, authenticated
  using (
    (
      (status = 'published' or author_id = (select auth.uid()))
      and exists (
        select 1
        from public.forum_threads thread
        join public.forum_categories category on category.id = thread.category_id
        where thread.id = thread_id
          and category.is_active = true
          and (category.public_read = true or (select auth.uid()) is not null)
      )
    )
    or public.is_admin_with('dashboard.view')
  );

drop policy if exists "forum_posts_insert_authenticated" on public.forum_posts;
create policy "forum_posts_insert_authenticated"
  on public.forum_posts for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and status = 'published'
    and exists (
      select 1
      from public.forum_threads thread
      join public.forum_categories category on category.id = thread.category_id
      where thread.id = thread_id
        and not thread.locked
        and category.is_active = true
        and (category.public_read = true or (select auth.uid()) is not null)
    )
  );

comment on column public.forum_categories.is_active is
  'Owner kill switch: inactive categories and their threads are not visible or writable publicly.';
comment on function public.admin_manage_forum_category(
  text, uuid, uuid, timestamptz, text, text, text, integer, boolean, boolean, text
) is 'Atomic service-role-only forum category lifecycle with actor authorization, CAS and audit.';
comment on function public.admin_set_forum_thread_state(
  uuid, uuid, boolean, boolean, boolean, boolean, text
) is 'Atomic service-role-only pin/lock CAS transition with actor authorization and audit.';
