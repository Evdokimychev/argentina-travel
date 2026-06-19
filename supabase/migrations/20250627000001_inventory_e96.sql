-- E96: Inventory & availability (slots + waitlist)

create table if not exists public.tour_availability_slots (
  id uuid primary key default gen_random_uuid(),
  tour_id text not null references public.tours (id) on delete cascade,
  date date not null,
  capacity integer not null default 0 check (capacity >= 0),
  booked_count integer not null default 0 check (booked_count >= 0),
  status text not null default 'open'
    check (status in ('open', 'closed', 'sold_out')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tour_id, date)
);

comment on table public.tour_availability_slots is
  'Слоты доступности тура по датам (E96).';

create index if not exists tour_availability_slots_tour_date_idx
  on public.tour_availability_slots (tour_id, date asc);

create index if not exists tour_availability_slots_status_date_idx
  on public.tour_availability_slots (status, date asc);

drop trigger if exists tour_availability_slots_set_updated_at on public.tour_availability_slots;
create trigger tour_availability_slots_set_updated_at
  before update on public.tour_availability_slots
  for each row execute function public.set_updated_at();

alter table public.tour_availability_slots enable row level security;

drop policy if exists "tour_availability_slots_public_select" on public.tour_availability_slots;
create policy "tour_availability_slots_public_select"
  on public.tour_availability_slots
  for select
  to anon, authenticated
  using (true);

drop policy if exists "tour_availability_slots_service_all" on public.tour_availability_slots;
create policy "tour_availability_slots_service_all"
  on public.tour_availability_slots
  for all
  to service_role
  using (true)
  with check (true);

create table if not exists public.tour_waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  tour_id text not null references public.tours (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  email text,
  contact_name text,
  contact_phone text,
  slot_date date,
  guests integer not null default 1 check (guests > 0),
  status text not null default 'waiting'
    check (status in ('waiting', 'contacted', 'offered', 'converted', 'cancelled')),
  source text not null default 'site' check (source in ('site', 'admin', 'api')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tour_waitlist_entries_contact_check check (user_id is not null or email is not null)
);

comment on table public.tour_waitlist_entries is
  'Лист ожидания по датам тура (E96).';

create index if not exists tour_waitlist_entries_tour_date_idx
  on public.tour_waitlist_entries (tour_id, slot_date asc, created_at desc);

create index if not exists tour_waitlist_entries_status_idx
  on public.tour_waitlist_entries (status, created_at desc);

create index if not exists tour_waitlist_entries_user_idx
  on public.tour_waitlist_entries (user_id, created_at desc);

drop trigger if exists tour_waitlist_entries_set_updated_at on public.tour_waitlist_entries;
create trigger tour_waitlist_entries_set_updated_at
  before update on public.tour_waitlist_entries
  for each row execute function public.set_updated_at();

alter table public.tour_waitlist_entries enable row level security;

drop policy if exists "tour_waitlist_entries_public_insert" on public.tour_waitlist_entries;
create policy "tour_waitlist_entries_public_insert"
  on public.tour_waitlist_entries
  for insert
  to anon, authenticated
  with check (status = 'waiting');

drop policy if exists "tour_waitlist_entries_service_all" on public.tour_waitlist_entries;
create policy "tour_waitlist_entries_service_all"
  on public.tour_waitlist_entries
  for all
  to service_role
  using (true)
  with check (true);
