-- Blog UX Phase 6: reading history sync, article comments, analytics extension

-- ---------------------------------------------------------------------------
-- Reading history (authenticated sync)
-- ---------------------------------------------------------------------------
create table if not exists public.blog_reading_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  article_slug text not null,
  article_title text not null,
  category text,
  read_at timestamptz not null default now(),
  constraint blog_reading_history_user_slug_key unique (user_id, article_slug),
  constraint blog_reading_history_slug_check check (char_length(trim(article_slug)) > 0),
  constraint blog_reading_history_title_check check (char_length(trim(article_title)) > 0)
);

create index if not exists blog_reading_history_user_read_at_idx
  on public.blog_reading_history (user_id, read_at desc);

comment on table public.blog_reading_history is
  'Синхронизация истории чтения блога для авторизованных пользователей';

alter table public.blog_reading_history enable row level security;

drop policy if exists "blog_reading_history_select_own" on public.blog_reading_history;
create policy "blog_reading_history_select_own"
  on public.blog_reading_history for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "blog_reading_history_insert_own" on public.blog_reading_history;
create policy "blog_reading_history_insert_own"
  on public.blog_reading_history for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "blog_reading_history_update_own" on public.blog_reading_history;
create policy "blog_reading_history_update_own"
  on public.blog_reading_history for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "blog_reading_history_delete_own" on public.blog_reading_history;
create policy "blog_reading_history_delete_own"
  on public.blog_reading_history for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "blog_reading_history_service_all" on public.blog_reading_history;
create policy "blog_reading_history_service_all"
  on public.blog_reading_history for all
  to service_role
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- Extend user_interactions for blog reads (server-side personalization)
-- ---------------------------------------------------------------------------
alter table public.user_interactions
  drop constraint if exists user_interactions_entity_type_check;

alter table public.user_interactions
  add constraint user_interactions_entity_type_check
  check (entity_type in ('tour', 'excursion', 'blog'));

alter table public.user_interactions
  drop constraint if exists user_interactions_action_check;

alter table public.user_interactions
  add constraint user_interactions_action_check
  check (action in ('view', 'favorite', 'read'));

comment on column public.user_interactions.entity_id is
  'Slug тура, экскурсии или статьи блога.';

-- ---------------------------------------------------------------------------
-- Article-scoped comments (lighter than forum)
-- ---------------------------------------------------------------------------
create table if not exists public.blog_article_comments (
  id uuid primary key default gen_random_uuid(),
  article_slug text not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  status text not null default 'published',
  parent_id uuid references public.blog_article_comments (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_article_comments_status_check check (
    status in ('pending', 'published', 'hidden')
  ),
  constraint blog_article_comments_body_check check (
    char_length(trim(body)) > 0 and char_length(body) <= 4000
  ),
  constraint blog_article_comments_slug_check check (char_length(trim(article_slug)) > 0)
);

create index if not exists blog_article_comments_slug_created_idx
  on public.blog_article_comments (article_slug, created_at);

create index if not exists blog_article_comments_user_idx
  on public.blog_article_comments (user_id);

create index if not exists blog_article_comments_status_idx
  on public.blog_article_comments (status);

drop trigger if exists blog_article_comments_set_updated_at on public.blog_article_comments;
create trigger blog_article_comments_set_updated_at
  before update on public.blog_article_comments
  for each row execute function public.set_updated_at();

comment on table public.blog_article_comments is
  'Комментарии к статьям блога; отдельно от форума';

alter table public.blog_article_comments enable row level security;

drop policy if exists "blog_article_comments_select" on public.blog_article_comments;
create policy "blog_article_comments_select"
  on public.blog_article_comments for select
  to anon, authenticated
  using (
    status = 'published'
    or user_id = auth.uid()
    or public.is_admin_with('dashboard.view')
  );

drop policy if exists "blog_article_comments_insert_authenticated" on public.blog_article_comments;
create policy "blog_article_comments_insert_authenticated"
  on public.blog_article_comments for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and status in ('pending', 'published')
  );

drop policy if exists "blog_article_comments_update_author" on public.blog_article_comments;
create policy "blog_article_comments_update_author"
  on public.blog_article_comments for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "blog_article_comments_staff_all" on public.blog_article_comments;
create policy "blog_article_comments_staff_all"
  on public.blog_article_comments for all
  to authenticated
  using (public.is_admin_with('marketplace.moderation'))
  with check (public.is_admin_with('marketplace.moderation'));

-- ---------------------------------------------------------------------------
-- Comment reports (moderation queue)
-- ---------------------------------------------------------------------------
create table if not exists public.blog_comment_reports (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.blog_article_comments (id) on delete cascade,
  reporter_user_id uuid references public.profiles (id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'pending',
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_comment_reports_status_check check (
    status in ('pending', 'resolved', 'dismissed')
  ),
  constraint blog_comment_reports_reason_check check (char_length(trim(reason)) > 0)
);

create index if not exists blog_comment_reports_comment_idx
  on public.blog_comment_reports (comment_id);

create index if not exists blog_comment_reports_status_idx
  on public.blog_comment_reports (status, created_at desc);

drop trigger if exists blog_comment_reports_set_updated_at on public.blog_comment_reports;
create trigger blog_comment_reports_set_updated_at
  before update on public.blog_comment_reports
  for each row execute function public.set_updated_at();

comment on table public.blog_comment_reports is
  'Жалобы на комментарии к статьям блога';

alter table public.blog_comment_reports enable row level security;

drop policy if exists "blog_comment_reports_insert_authenticated" on public.blog_comment_reports;
create policy "blog_comment_reports_insert_authenticated"
  on public.blog_comment_reports for insert
  to authenticated
  with check (reporter_user_id = auth.uid());

drop policy if exists "blog_comment_reports_select_own" on public.blog_comment_reports;
create policy "blog_comment_reports_select_own"
  on public.blog_comment_reports for select
  to authenticated
  using (reporter_user_id = auth.uid());

drop policy if exists "blog_comment_reports_select_staff" on public.blog_comment_reports;
create policy "blog_comment_reports_select_staff"
  on public.blog_comment_reports for select
  to authenticated
  using (public.is_admin_with('dashboard.view'));

drop policy if exists "blog_comment_reports_update_staff" on public.blog_comment_reports;
create policy "blog_comment_reports_update_staff"
  on public.blog_comment_reports for update
  to authenticated
  using (public.is_admin_with('marketplace.moderation'))
  with check (public.is_admin_with('marketplace.moderation'));

drop policy if exists "blog_comment_reports_service_all" on public.blog_comment_reports;
create policy "blog_comment_reports_service_all"
  on public.blog_comment_reports for all
  to service_role
  using (true)
  with check (true);
