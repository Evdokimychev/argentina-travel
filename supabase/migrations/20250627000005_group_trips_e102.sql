-- E102: Group trip listings / co-travel (совместные поездки)

create table if not exists public.group_trip_listings (
  id uuid primary key default gen_random_uuid(),
  tour_id text not null references public.tours (id) on delete cascade,
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  creator_user_id uuid not null references public.profiles (id) on delete cascade,
  slot_date date not null,
  availability_slot_id uuid references public.tour_availability_slots (id) on delete set null,
  min_participants integer not null default 2 check (min_participants >= 2),
  max_participants integer not null check (max_participants >= 2),
  status text not null default 'open'
    check (status in ('open', 'full', 'confirmed', 'cancelled')),
  description text,
  min_reached_notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint group_trip_listings_max_gte_min check (max_participants >= min_participants)
);

comment on table public.group_trip_listings is
  'Набор группы к дате тура — совместная поездка (E102).';

create index if not exists group_trip_listings_tour_date_idx
  on public.group_trip_listings (tour_id, slot_date asc, created_at desc);

create index if not exists group_trip_listings_organizer_idx
  on public.group_trip_listings (organizer_id, status, created_at desc);

create index if not exists group_trip_listings_creator_idx
  on public.group_trip_listings (creator_user_id, created_at desc);

create index if not exists group_trip_listings_status_idx
  on public.group_trip_listings (status, slot_date asc);

drop trigger if exists group_trip_listings_set_updated_at on public.group_trip_listings;
create trigger group_trip_listings_set_updated_at
  before update on public.group_trip_listings
  for each row execute function public.set_updated_at();

alter table public.group_trip_listings enable row level security;

drop policy if exists "group_trip_listings_public_select" on public.group_trip_listings;
create policy "group_trip_listings_public_select"
  on public.group_trip_listings
  for select
  to anon, authenticated
  using (status <> 'cancelled');

drop policy if exists "group_trip_listings_organizer_select" on public.group_trip_listings;
create policy "group_trip_listings_organizer_select"
  on public.group_trip_listings
  for select
  to authenticated
  using (organizer_id = auth.uid());

drop policy if exists "group_trip_listings_insert_creator" on public.group_trip_listings;
create policy "group_trip_listings_insert_creator"
  on public.group_trip_listings
  for insert
  to authenticated
  with check (creator_user_id = auth.uid());

drop policy if exists "group_trip_listings_update_creator" on public.group_trip_listings;
create policy "group_trip_listings_update_creator"
  on public.group_trip_listings
  for update
  to authenticated
  using (creator_user_id = auth.uid() and status in ('open', 'full'))
  with check (creator_user_id = auth.uid());

drop policy if exists "group_trip_listings_service_all" on public.group_trip_listings;
create policy "group_trip_listings_service_all"
  on public.group_trip_listings
  for all
  to service_role
  using (true)
  with check (true);

create table if not exists public.group_trip_members (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.group_trip_listings (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'interested'
    check (status in ('interested', 'confirmed', 'declined')),
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, user_id)
);

comment on table public.group_trip_members is
  'Участники набора группы (E102).';

create index if not exists group_trip_members_listing_idx
  on public.group_trip_members (listing_id, status);

create index if not exists group_trip_members_user_idx
  on public.group_trip_members (user_id, joined_at desc);

drop trigger if exists group_trip_members_set_updated_at on public.group_trip_members;
create trigger group_trip_members_set_updated_at
  before update on public.group_trip_members
  for each row execute function public.set_updated_at();

alter table public.group_trip_members enable row level security;

drop policy if exists "group_trip_members_select" on public.group_trip_members;
create policy "group_trip_members_select"
  on public.group_trip_members
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.group_trip_listings l
      where l.id = listing_id
        and l.status <> 'cancelled'
    )
  );

drop policy if exists "group_trip_members_insert_own" on public.group_trip_members;
create policy "group_trip_members_insert_own"
  on public.group_trip_members
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "group_trip_members_update_own" on public.group_trip_members;
create policy "group_trip_members_update_own"
  on public.group_trip_members
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "group_trip_members_service_all" on public.group_trip_members;
create policy "group_trip_members_service_all"
  on public.group_trip_members
  for all
  to service_role
  using (true)
  with check (true);
