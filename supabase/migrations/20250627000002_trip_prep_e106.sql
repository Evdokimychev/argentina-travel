-- E106: Trip Prep Hub — templates, checklist items, progress, reminder dedupe

create table if not exists public.trip_prep_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tour_type text not null default 'default'
    check (tour_type in ('default', 'group', 'individual', 'partner')),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.trip_prep_templates is
  'Шаблоны чек-листа подготовки к поездке (E106).';

create unique index if not exists trip_prep_templates_default_unique_idx
  on public.trip_prep_templates (is_default)
  where is_default = true;

create index if not exists trip_prep_templates_tour_type_idx
  on public.trip_prep_templates (tour_type);

drop trigger if exists trip_prep_templates_set_updated_at on public.trip_prep_templates;
create trigger trip_prep_templates_set_updated_at
  before update on public.trip_prep_templates
  for each row execute function public.set_updated_at();

alter table public.trip_prep_templates enable row level security;

drop policy if exists "trip_prep_templates_public_select" on public.trip_prep_templates;
create policy "trip_prep_templates_public_select"
  on public.trip_prep_templates
  for select
  to anon, authenticated
  using (true);

drop policy if exists "trip_prep_templates_service_all" on public.trip_prep_templates;
create policy "trip_prep_templates_service_all"
  on public.trip_prep_templates
  for all
  to service_role
  using (true)
  with check (true);

create table if not exists public.trip_prep_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.trip_prep_templates (id) on delete cascade,
  category text not null
    check (category in (
      'documents',
      'connectivity',
      'money',
      'health',
      'luggage',
      'transfer',
      'organizer'
    )),
  title text not null,
  description text,
  sort_order integer not null default 0,
  required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.trip_prep_items is
  'Пункты чек-листа подготовки к поездке (E106).';

create index if not exists trip_prep_items_template_sort_idx
  on public.trip_prep_items (template_id, sort_order asc, created_at asc);

drop trigger if exists trip_prep_items_set_updated_at on public.trip_prep_items;
create trigger trip_prep_items_set_updated_at
  before update on public.trip_prep_items
  for each row execute function public.set_updated_at();

alter table public.trip_prep_items enable row level security;

drop policy if exists "trip_prep_items_public_select" on public.trip_prep_items;
create policy "trip_prep_items_public_select"
  on public.trip_prep_items
  for select
  to anon, authenticated
  using (true);

drop policy if exists "trip_prep_items_service_all" on public.trip_prep_items;
create policy "trip_prep_items_service_all"
  on public.trip_prep_items
  for all
  to service_role
  using (true)
  with check (true);

create table if not exists public.trip_prep_progress (
  id uuid primary key default gen_random_uuid(),
  booking_id text not null references public.bookings (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id uuid not null references public.trip_prep_items (id) on delete cascade,
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (booking_id, user_id, item_id)
);

comment on table public.trip_prep_progress is
  'Прогресс туриста по чек-листу подготовки (E106).';

create index if not exists trip_prep_progress_booking_user_idx
  on public.trip_prep_progress (booking_id, user_id);

create index if not exists trip_prep_progress_user_idx
  on public.trip_prep_progress (user_id, checked_at desc);

alter table public.trip_prep_progress enable row level security;

drop policy if exists "trip_prep_progress_owner_select" on public.trip_prep_progress;
create policy "trip_prep_progress_owner_select"
  on public.trip_prep_progress
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "trip_prep_progress_owner_insert" on public.trip_prep_progress;
create policy "trip_prep_progress_owner_insert"
  on public.trip_prep_progress
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "trip_prep_progress_owner_update" on public.trip_prep_progress;
create policy "trip_prep_progress_owner_update"
  on public.trip_prep_progress
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "trip_prep_progress_owner_delete" on public.trip_prep_progress;
create policy "trip_prep_progress_owner_delete"
  on public.trip_prep_progress
  for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "trip_prep_progress_service_all" on public.trip_prep_progress;
create policy "trip_prep_progress_service_all"
  on public.trip_prep_progress
  for all
  to service_role
  using (true)
  with check (true);

create table if not exists public.trip_prep_reminders_sent (
  id uuid primary key default gen_random_uuid(),
  booking_id text not null references public.bookings (id) on delete cascade,
  kind text not null check (kind in ('7d', '3d', '1d')),
  sent_at timestamptz not null default now(),
  unique (booking_id, kind)
);

comment on table public.trip_prep_reminders_sent is
  'Дедупликация напоминаний о подготовке к поездке (E106).';

create index if not exists trip_prep_reminders_sent_booking_idx
  on public.trip_prep_reminders_sent (booking_id, sent_at desc);

alter table public.trip_prep_reminders_sent enable row level security;

drop policy if exists "trip_prep_reminders_sent_service_all" on public.trip_prep_reminders_sent;
create policy "trip_prep_reminders_sent_service_all"
  on public.trip_prep_reminders_sent
  for all
  to service_role
  using (true)
  with check (true);

-- Seed: default template «Стандартная поездка в Аргентину»
insert into public.trip_prep_templates (id, name, tour_type, is_default)
values (
  'e1060000-0000-4000-8000-000000000001',
  'Стандартная поездка в Аргентину',
  'default',
  true
)
on conflict (id) do nothing;

insert into public.trip_prep_items (id, template_id, category, title, description, sort_order, required)
values
  (
    'e1060000-0000-4000-8000-000000000101',
    'e1060000-0000-4000-8000-000000000001',
    'documents',
    'Проверить срок действия загранпаспорта',
    'Убедитесь, что документ действителен минимум 6 месяцев после даты возвращения. Правила могут меняться — уточняйте перед поездкой.',
    10,
    true
  ),
  (
    'e1060000-0000-4000-8000-000000000102',
    'e1060000-0000-4000-8000-000000000001',
    'documents',
    'Сохранить подтверждение бронирования',
    'Распечатайте или сохраните офлайн письмо с деталями заявки и контактами организатора.',
    20,
    false
  ),
  (
    'e1060000-0000-4000-8000-000000000103',
    'e1060000-0000-4000-8000-000000000001',
    'connectivity',
    'Подготовить связь в поездке',
    'Купите eSIM или местную SIM-карту заранее либо уточните у оператора условия роуминга.',
    30,
    false
  ),
  (
    'e1060000-0000-4000-8000-000000000104',
    'e1060000-0000-4000-8000-000000000001',
    'connectivity',
    'Скачать офлайн-карты',
    'Сохраните карты Буэнос-Айреса и региона тура в Google Maps или аналоге — связь в пути не всегда стабильна.',
    40,
    false
  ),
  (
    'e1060000-0000-4000-8000-000000000105',
    'e1060000-0000-4000-8000-000000000001',
    'money',
    'Уведомить банк о поездке',
    'Сообщите банку даты поездки, чтобы не заблокировали карту при оплатах в Аргентине.',
    50,
    true
  ),
  (
    'e1060000-0000-4000-8000-000000000106',
    'e1060000-0000-4000-8000-000000000001',
    'money',
    'Подготовить наличные песо',
    'Имейте небольшую сумму на первые дни: такси, чаевые, мелкие покупки. Курс и способы обмена уточняйте перед поездкой.',
    60,
    false
  ),
  (
    'e1060000-0000-4000-8000-000000000107',
    'e1060000-0000-4000-8000-000000000001',
    'health',
    'Оформить медицинскую страховку',
    'Полис должен покрывать поездку за границу и активности по программе тура.',
    70,
    true
  ),
  (
    'e1060000-0000-4000-8000-000000000108',
    'e1060000-0000-4000-8000-000000000001',
    'health',
    'Собрать базовую аптечку',
    'Возьмите лекарства по назначению, средства от солнца и насекомых — особенно для южных регионов.',
    80,
    false
  ),
  (
    'e1060000-0000-4000-8000-000000000109',
    'e1060000-0000-4000-8000-000000000001',
    'luggage',
    'Проверить нормы багажа',
    'Сверьте вес и габариты с правилами авиакомпании; учтите перелёты внутри страны, если они есть в программе.',
    90,
    false
  ),
  (
    'e1060000-0000-4000-8000-000000000110',
    'e1060000-0000-4000-8000-000000000001',
    'luggage',
    'Подобрать одежду по сезону и региону',
    'Патагония, Анд и Буэнос-Айрес требуют разного гардероба — проверьте прогноз и рекомендации организатора.',
    100,
    false
  ),
  (
    'e1060000-0000-4000-8000-000000000111',
    'e1060000-0000-4000-8000-000000000001',
    'transfer',
    'Уточнить место и время встречи',
    'Запишите адрес, время и способ добраться до точки старта — особенно если прилёт ночью.',
    110,
    true
  ),
  (
    'e1060000-0000-4000-8000-000000000112',
    'e1060000-0000-4000-8000-000000000001',
    'organizer',
    'Сохранить контакты организатора',
    'Добавьте телефон и WhatsApp организатора в телефонную книгу и продублируйте в мессенджере.',
    120,
    true
  )
on conflict (id) do nothing;
