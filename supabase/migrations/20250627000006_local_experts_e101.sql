-- E101: Local experts catalog, inquiries, messaging integration

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'expert_category') then
    create type public.expert_category as enum (
      'guide',
      'relocation',
      'photo',
      'family',
      'nature',
      'food'
    );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Local experts
-- ---------------------------------------------------------------------------
create table if not exists public.local_experts (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  bio text not null default '',
  city text not null,
  categories public.expert_category[] not null default '{}',
  languages text[] not null default '{ru}',
  avatar_url text,
  contact_mode text not null default 'message'
    check (contact_mode in ('message', 'email', 'both')),
  user_id uuid references auth.users (id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint local_experts_slug_key unique (slug)
);

create index if not exists local_experts_status_city_idx
  on public.local_experts (status, city);

create index if not exists local_experts_user_idx
  on public.local_experts (user_id)
  where user_id is not null;

drop trigger if exists local_experts_set_updated_at on public.local_experts;
create trigger local_experts_set_updated_at
  before update on public.local_experts
  for each row execute function public.set_updated_at();

comment on table public.local_experts is
  'Каталог локальных экспертов (E101): гиды, консультанты, фотографы.';

-- ---------------------------------------------------------------------------
-- Expert inquiries (CRM)
-- ---------------------------------------------------------------------------
create table if not exists public.expert_inquiries (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references public.local_experts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  message text not null,
  status text not null default 'open'
    check (status in ('open', 'replied', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expert_inquiries_message_check check (
    char_length(trim(message)) > 0 and char_length(message) <= 4000
  )
);

create index if not exists expert_inquiries_expert_status_idx
  on public.expert_inquiries (expert_id, status, created_at desc);

create index if not exists expert_inquiries_user_idx
  on public.expert_inquiries (user_id, created_at desc);

drop trigger if exists expert_inquiries_set_updated_at on public.expert_inquiries;
create trigger expert_inquiries_set_updated_at
  before update on public.expert_inquiries
  for each row execute function public.set_updated_at();

comment on table public.expert_inquiries is
  'Обращения туристов к локальным экспертам (E101).';

-- ---------------------------------------------------------------------------
-- Conversation threads: expert inquiry support
-- ---------------------------------------------------------------------------
alter table public.conversation_threads
  alter column booking_id drop not null;

alter table public.conversation_threads
  add column if not exists expert_inquiry_id uuid
    references public.expert_inquiries (id) on delete cascade;

alter table public.conversation_threads
  drop constraint if exists conversation_threads_booking_id_key;

create unique index if not exists conversation_threads_booking_id_unique
  on public.conversation_threads (booking_id)
  where booking_id is not null;

create unique index if not exists conversation_threads_expert_inquiry_id_unique
  on public.conversation_threads (expert_inquiry_id)
  where expert_inquiry_id is not null;

alter table public.conversation_threads
  drop constraint if exists conversation_threads_context_check;

alter table public.conversation_threads
  add constraint conversation_threads_context_check check (
    (
      booking_id is not null
      and expert_inquiry_id is null
    )
    or (
      booking_id is null
      and expert_inquiry_id is not null
    )
  );

-- ---------------------------------------------------------------------------
-- Row Level Security — local_experts
-- ---------------------------------------------------------------------------
alter table public.local_experts enable row level security;

drop policy if exists "local_experts_public_select_published" on public.local_experts;
create policy "local_experts_public_select_published"
  on public.local_experts for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "local_experts_select_own" on public.local_experts;
create policy "local_experts_select_own"
  on public.local_experts for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "local_experts_insert_own_pending" on public.local_experts;
create policy "local_experts_insert_own_pending"
  on public.local_experts for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
  );

drop policy if exists "local_experts_select_staff" on public.local_experts;
create policy "local_experts_select_staff"
  on public.local_experts for select
  to authenticated
  using (public.is_admin_with('marketplace.moderation'));

drop policy if exists "local_experts_update_staff" on public.local_experts;
create policy "local_experts_update_staff"
  on public.local_experts for update
  to authenticated
  using (public.is_admin_with('marketplace.moderation'))
  with check (public.is_admin_with('marketplace.moderation'));

drop policy if exists "local_experts_service_all" on public.local_experts;
create policy "local_experts_service_all"
  on public.local_experts for all
  to service_role
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- Row Level Security — expert_inquiries
-- ---------------------------------------------------------------------------
alter table public.expert_inquiries enable row level security;

drop policy if exists "expert_inquiries_insert_own" on public.expert_inquiries;
create policy "expert_inquiries_insert_own"
  on public.expert_inquiries for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and status = 'open'
  );

drop policy if exists "expert_inquiries_select_own" on public.expert_inquiries;
create policy "expert_inquiries_select_own"
  on public.expert_inquiries for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "expert_inquiries_select_expert" on public.expert_inquiries;
create policy "expert_inquiries_select_expert"
  on public.expert_inquiries for select
  to authenticated
  using (
    exists (
      select 1
      from public.local_experts e
      where e.id = expert_inquiries.expert_id
        and e.user_id = auth.uid()
    )
  );

drop policy if exists "expert_inquiries_select_staff" on public.expert_inquiries;
create policy "expert_inquiries_select_staff"
  on public.expert_inquiries for select
  to authenticated
  using (public.is_admin_with('marketplace.moderation'));

drop policy if exists "expert_inquiries_update_staff" on public.expert_inquiries;
create policy "expert_inquiries_update_staff"
  on public.expert_inquiries for update
  to authenticated
  using (public.is_admin_with('marketplace.moderation'))
  with check (public.is_admin_with('marketplace.moderation'));

drop policy if exists "expert_inquiries_update_expert" on public.expert_inquiries;
create policy "expert_inquiries_update_expert"
  on public.expert_inquiries for update
  to authenticated
  using (
    exists (
      select 1
      from public.local_experts e
      where e.id = expert_inquiries.expert_id
        and e.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.local_experts e
      where e.id = expert_inquiries.expert_id
        and e.user_id = auth.uid()
    )
  );

drop policy if exists "expert_inquiries_service_all" on public.expert_inquiries;
create policy "expert_inquiries_service_all"
  on public.expert_inquiries for all
  to service_role
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- Demo seed — 6 published experts
-- ---------------------------------------------------------------------------
insert into public.local_experts (
  slug,
  name,
  bio,
  city,
  categories,
  languages,
  avatar_url,
  contact_mode,
  status
)
values
  (
    'maria-iguazu',
    'Мария Гонсалес',
    'Гид по национальному парку Игуасу и окрестностям. Русский и испанский, группы до 8 человек, индивидуальные маршруты по водопадам.',
    'Пуэрто-Игуасу',
    array['guide', 'nature']::public.expert_category[],
    array['ru', 'es'],
    null,
    'message',
    'published'
  ),
  (
    'diego-relocation',
    'Diego Fernández',
    'Консультант по переезду в Буэнос-Айрес: аренда жилья, DNI, банки, школы. Помогаю семьям и фрилансерам с первыми шагами.',
    'Буэнос-Айрес',
    array['relocation']::public.expert_category[],
    array['ru', 'es', 'en'],
    null,
    'message',
    'published'
  ),
  (
    'lucia-photo',
    'Lucía Martínez',
    'Фотограф винных регионов и Анд: съёмки для пар, семей и блогеров. Знаю лучшие ракурсы Мендосы и Успallata.',
    'Мендоса',
    array['photo', 'nature']::public.expert_category[],
    array['es', 'en'],
    null,
    'message',
    'published'
  ),
  (
    'ana-family',
    'Ana Rodríguez',
    'Семейный гид по Bariloche и озёрному краю: маршруты с детьми, безопасные тропы, зимние активности.',
    'Bariloche',
    array['family', 'guide']::public.expert_category[],
    array['ru', 'es'],
    null,
    'message',
    'published'
  ),
  (
    'carlos-food',
    'Carlos Pérez',
    'Гастрономические прогулки по Буэнос-Айресу: parrilla, empanadas, кофе и рынки. Дегустации и истории районов.',
    'Буэнос-Айрес',
    array['food', 'guide']::public.expert_category[],
    array['es', 'en'],
    null,
    'message',
    'published'
  ),
  (
    'sofia-calafate',
    'Sofía López',
    'Гид по ледникам Патагонии: Perito Moreno, ледовые походы, советы по экипировке. Работаю с малыми группами.',
    'Эль-Калафате',
    array['nature', 'guide']::public.expert_category[],
    array['ru', 'es', 'en'],
    null,
    'message',
    'published'
  )
on conflict (slug) do nothing;
