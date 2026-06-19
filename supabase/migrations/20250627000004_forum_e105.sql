-- E105: Forum — categories, threads, posts, reports, RLS
-- Apply via: npm run supabase:migrate

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
create table if not exists public.forum_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  description text,
  public_read boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  constraint forum_categories_slug_key unique (slug),
  constraint forum_categories_title_check check (char_length(trim(title)) > 0)
);

create index if not exists forum_categories_sort_idx
  on public.forum_categories (sort_order, title);

comment on table public.forum_categories is 'Forum sections; public_read allows guest read access';

-- ---------------------------------------------------------------------------
-- Threads
-- ---------------------------------------------------------------------------
create table if not exists public.forum_threads (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.forum_categories (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  title text not null,
  pinned boolean not null default false,
  locked boolean not null default false,
  last_post_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint forum_threads_title_check check (char_length(trim(title)) > 0 and char_length(title) <= 200)
);

create index if not exists forum_threads_category_last_post_idx
  on public.forum_threads (category_id, pinned desc, last_post_at desc);
create index if not exists forum_threads_author_idx on public.forum_threads (author_id);

drop trigger if exists forum_threads_set_updated_at on public.forum_threads;
create trigger forum_threads_set_updated_at
  before update on public.forum_threads
  for each row execute function public.set_updated_at();

comment on table public.forum_threads is 'Discussion threads within a forum category';

-- ---------------------------------------------------------------------------
-- Posts
-- ---------------------------------------------------------------------------
create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.forum_threads (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  body text not null,
  status text not null default 'published',
  edited_at timestamptz,
  created_at timestamptz not null default now(),
  constraint forum_posts_status_check check (status in ('published', 'hidden')),
  constraint forum_posts_body_check check (
    char_length(trim(body)) > 0 and char_length(body) <= 10000
  )
);

create index if not exists forum_posts_thread_created_idx
  on public.forum_posts (thread_id, created_at);
create index if not exists forum_posts_author_idx on public.forum_posts (author_id);
create index if not exists forum_posts_status_idx on public.forum_posts (status);

comment on table public.forum_posts is 'Messages in a forum thread';

-- Keep thread.last_post_at in sync with latest published post
create or replace function public.touch_forum_thread_on_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.forum_threads
  set last_post_at = new.created_at,
      updated_at = new.created_at
  where id = new.thread_id;
  return new;
end;
$$;

drop trigger if exists forum_posts_touch_thread on public.forum_posts;
create trigger forum_posts_touch_thread
  after insert on public.forum_posts
  for each row execute function public.touch_forum_thread_on_post();

-- ---------------------------------------------------------------------------
-- Post reports
-- ---------------------------------------------------------------------------
create table if not exists public.forum_post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.forum_posts (id) on delete cascade,
  reporter_user_id uuid references public.profiles (id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'pending',
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint forum_post_reports_status_check check (
    status in ('pending', 'resolved', 'dismissed')
  )
);

create index if not exists forum_post_reports_post_idx on public.forum_post_reports (post_id);
create index if not exists forum_post_reports_status_idx
  on public.forum_post_reports (status, created_at desc);

drop trigger if exists forum_post_reports_set_updated_at on public.forum_post_reports;
create trigger forum_post_reports_set_updated_at
  before update on public.forum_post_reports
  for each row execute function public.set_updated_at();

comment on table public.forum_post_reports is 'User complaints about forum posts';

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.forum_categories enable row level security;
alter table public.forum_threads enable row level security;
alter table public.forum_posts enable row level security;
alter table public.forum_post_reports enable row level security;

-- Categories: guests see public sections; signed-in users see all
drop policy if exists "forum_categories_select_anon" on public.forum_categories;
create policy "forum_categories_select_anon"
  on public.forum_categories for select
  to anon
  using (public_read = true);

drop policy if exists "forum_categories_select_authenticated" on public.forum_categories;
create policy "forum_categories_select_authenticated"
  on public.forum_categories for select
  to authenticated
  using (true);

drop policy if exists "forum_categories_staff_all" on public.forum_categories;
create policy "forum_categories_staff_all"
  on public.forum_categories for all
  to authenticated
  using (public.is_admin_with('marketplace.moderation'))
  with check (public.is_admin_with('marketplace.moderation'));

-- Threads: readable when category is accessible
drop policy if exists "forum_threads_select" on public.forum_threads;
create policy "forum_threads_select"
  on public.forum_threads for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.forum_categories c
      where c.id = category_id
        and (c.public_read = true or auth.uid() is not null)
    )
    or public.is_admin_with('dashboard.view')
  );

drop policy if exists "forum_threads_insert_authenticated" on public.forum_threads;
create policy "forum_threads_insert_authenticated"
  on public.forum_threads for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.forum_categories c
      where c.id = category_id
        and (c.public_read = true or auth.uid() is not null)
    )
  );

drop policy if exists "forum_threads_update_author" on public.forum_threads;
create policy "forum_threads_update_author"
  on public.forum_threads for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists "forum_threads_staff_all" on public.forum_threads;
create policy "forum_threads_staff_all"
  on public.forum_threads for all
  to authenticated
  using (public.is_admin_with('marketplace.moderation'))
  with check (public.is_admin_with('marketplace.moderation'));

-- Posts: published posts in accessible threads; authors and staff see own/hidden
drop policy if exists "forum_posts_select" on public.forum_posts;
create policy "forum_posts_select"
  on public.forum_posts for select
  to anon, authenticated
  using (
    (
      status = 'published'
      and exists (
        select 1
        from public.forum_threads t
        join public.forum_categories c on c.id = t.category_id
        where t.id = thread_id
          and (c.public_read = true or auth.uid() is not null)
      )
    )
    or author_id = auth.uid()
    or public.is_admin_with('dashboard.view')
  );

drop policy if exists "forum_posts_insert_authenticated" on public.forum_posts;
create policy "forum_posts_insert_authenticated"
  on public.forum_posts for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and status = 'published'
    and exists (
      select 1
      from public.forum_threads t
      join public.forum_categories c on c.id = t.category_id
      where t.id = thread_id
        and not t.locked
        and (c.public_read = true or auth.uid() is not null)
    )
  );

drop policy if exists "forum_posts_update_author" on public.forum_posts;
create policy "forum_posts_update_author"
  on public.forum_posts for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists "forum_posts_staff_all" on public.forum_posts;
create policy "forum_posts_staff_all"
  on public.forum_posts for all
  to authenticated
  using (public.is_admin_with('marketplace.moderation'))
  with check (public.is_admin_with('marketplace.moderation'));

-- Reports
drop policy if exists "forum_post_reports_insert_authenticated" on public.forum_post_reports;
create policy "forum_post_reports_insert_authenticated"
  on public.forum_post_reports for insert
  to authenticated
  with check (reporter_user_id = auth.uid());

drop policy if exists "forum_post_reports_select_own" on public.forum_post_reports;
create policy "forum_post_reports_select_own"
  on public.forum_post_reports for select
  to authenticated
  using (reporter_user_id = auth.uid());

drop policy if exists "forum_post_reports_select_staff" on public.forum_post_reports;
create policy "forum_post_reports_select_staff"
  on public.forum_post_reports for select
  to authenticated
  using (public.is_admin_with('dashboard.view'));

drop policy if exists "forum_post_reports_update_staff" on public.forum_post_reports;
create policy "forum_post_reports_update_staff"
  on public.forum_post_reports for update
  to authenticated
  using (public.is_admin_with('marketplace.moderation'))
  with check (public.is_admin_with('marketplace.moderation'));

-- ---------------------------------------------------------------------------
-- Seed categories, threads, and starter posts
-- ---------------------------------------------------------------------------
insert into public.forum_categories (id, slug, title, description, public_read, sort_order)
values
  (
    'f1050001-0001-4001-8001-000000000001',
    'buenos-aires',
    'Буэнос-Айрес',
    'Районы, транспорт, аренда жилья и повседневная жизнь в столице.',
    true,
    10
  ),
  (
    'f1050001-0001-4001-8001-000000000002',
    'immigration',
    'Иммиграция и документы',
    'ВНЖ, RADEX, гражданство и правила — уточняйте актуальные требования перед поездкой.',
    true,
    20
  ),
  (
    'f1050001-0001-4001-8001-000000000003',
    'tours',
    'Туры и маршруты',
    'Вопросы о поездках по Аргентине, сезонах и выборе маршрута.',
    true,
    30
  ),
  (
    'f1050001-0001-4001-8001-000000000004',
    'members',
    'Для участников',
    'Закрытый раздел для зарегистрированных пользователей: личный опыт и советы.',
    false,
    40
  )
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  public_read = excluded.public_read,
  sort_order = excluded.sort_order;

insert into public.forum_threads (id, category_id, author_id, title, pinned, last_post_at)
values
  (
    'f1050002-0002-4002-8002-000000000001',
    'f1050001-0001-4001-8001-000000000001',
    null,
    'С чего начать жизнь в Палермо?',
    true,
    now() - interval '2 days'
  ),
  (
    'f1050002-0002-4002-8002-000000000002',
    'f1050001-0001-4001-8001-000000000002',
    null,
    'Сроки записи в миграционную службу через RADEX',
    false,
    now() - interval '1 day'
  ),
  (
    'f1050002-0002-4002-8002-000000000003',
    'f1050001-0001-4001-8001-000000000003',
    null,
    'Патагония в марте: что учесть при выборе тура',
    false,
    now() - interval '5 hours'
  ),
  (
    'f1050002-0002-4002-8002-000000000004',
    'f1050001-0001-4001-8001-000000000004',
    null,
    'Как искать попутчиков на групповой тур',
    false,
    now() - interval '3 hours'
  )
on conflict (id) do nothing;

insert into public.forum_posts (id, thread_id, author_id, body, created_at)
values
  (
    'f1050003-0003-4003-8003-000000000001',
    'f1050002-0002-4002-8002-000000000001',
    null,
    'Палермо делится на несколько баррио: Soho, Hollywood, Chico. Для первых недель удобны районы с метро и кафе поблизости — **Palermo Soho** или **Recoleta** рядом. Карту супермаркетов и Subte лучше сохранить офлайн.',
    now() - interval '2 days'
  ),
  (
    'f1050003-0003-4003-8003-000000000002',
    'f1050002-0002-4002-8002-000000000002',
    null,
    'Сроки в RADEX меняются — перед подачей проверьте официальный сайт Migraciones. Обычно имеет смысл мониторить слоты утром по времени Буэнос-Айреса и иметь сканы всех документов заранее.',
    now() - interval '1 day'
  ),
  (
    'f1050003-0003-4003-8003-000000000003',
    'f1050002-0002-4002-8002-000000000003',
    null,
    'В марте в Патагонии ещё прохладно и ветрено. Берите слои одежды, не только лёгкую куртку. Для ледников часто нужна более ранняя бронь — места на лодки разбирают заранее.',
    now() - interval '5 hours'
  ),
  (
    'f1050003-0003-4003-8003-000000000004',
    'f1050002-0002-4002-8002-000000000004',
    null,
    'Если ищете попутчиков, напишите даты, бюджет и темп поездки. Организаторы на платформе иногда помогают собрать группу — уточняйте в карточке тура.',
    now() - interval '3 hours'
  )
on conflict (id) do nothing;
