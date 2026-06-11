-- Phase 2: Supabase Auth profiles + bookings
-- Apply via: npm run supabase:migrate

-- ---------------------------------------------------------------------------
-- Profiles (1:1 auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  phone text,
  email text,
  avatar_url text,
  country text not null default 'Россия',
  date_of_birth date,
  roles text[] not null default array['tourist']::text[],
  active_role text not null default 'tourist',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_roles_check check (
    roles <@ array['tourist', 'organizer', 'admin']::text[]
  ),
  constraint profiles_active_role_check check (
    active_role in ('tourist', 'organizer', 'admin')
  )
);

create index if not exists profiles_phone_idx on public.profiles (phone);
create index if not exists profiles_email_idx on public.profiles (lower(email));

comment on table public.profiles is 'User profile linked to Supabase Auth';

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb;
  role_text text;
  user_roles text[];
begin
  meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  role_text := coalesce(meta->>'role', 'tourist');
  user_roles := case
    when role_text = 'organizer' then array['tourist', 'organizer']::text[]
    else array[role_text]::text[]
  end;

  insert into public.profiles (
    id,
    email,
    first_name,
    last_name,
    phone,
    country,
    date_of_birth,
    roles,
    active_role
  )
  values (
    new.id,
    new.email,
    coalesce(meta->>'first_name', ''),
    coalesce(meta->>'last_name', ''),
    nullif(meta->>'phone', ''),
    coalesce(meta->>'country', 'Россия'),
    nullif(meta->>'date_of_birth', '')::date,
    user_roles,
    role_text
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Bookings
-- ---------------------------------------------------------------------------
create table if not exists public.bookings (
  id text primary key,
  user_id uuid references auth.users (id) on delete set null,
  guest_user_id text,
  organizer_user_id text,
  tour_id text not null,
  tour_slug text not null,
  tour_title text not null,
  tour_image text not null default '',
  status text not null default 'new',
  guests integer not null default 1 check (guests > 0),
  total_price_usd numeric(12, 2) not null default 0,
  contact_name text not null default '',
  contact_email text not null,
  contact_phone text not null default '',
  start_date date,
  end_date date,
  payment_status text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_status_check check (
    status in (
      'new', 'pending', 'confirmed', 'cancelled', 'completed',
      'waiting_payment', 'paid'
    )
  )
);

create index if not exists bookings_user_id_idx on public.bookings (user_id);
create index if not exists bookings_guest_user_id_idx on public.bookings (guest_user_id);
create index if not exists bookings_organizer_user_id_idx on public.bookings (organizer_user_id);
create index if not exists bookings_contact_email_idx on public.bookings (lower(contact_email));
create index if not exists bookings_created_at_idx on public.bookings (created_at desc);
create index if not exists bookings_tour_slug_idx on public.bookings (tour_slug);

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

comment on table public.bookings is 'Tour booking requests — nested data in payload jsonb';

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.bookings enable row level security;

-- Profiles: own row
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Bookings: insert (authenticated owner or guest via API with null user_id)
drop policy if exists "bookings_insert_authenticated" on public.bookings;
create policy "bookings_insert_authenticated"
  on public.bookings for insert
  to authenticated
  with check (
    user_id = auth.uid()
    or (user_id is null and guest_user_id is not null)
  );

drop policy if exists "bookings_insert_guest" on public.bookings;
create policy "bookings_insert_guest"
  on public.bookings for insert
  to anon
  with check (user_id is null and guest_user_id is not null);

-- Bookings: select
drop policy if exists "bookings_select_owner" on public.bookings;
create policy "bookings_select_owner"
  on public.bookings for select
  to authenticated
  using (
    user_id = auth.uid()
    or lower(contact_email) = lower(
      coalesce(
        (select email from public.profiles where id = auth.uid()),
        ''
      )
    )
    or organizer_user_id = auth.uid()::text
  );

-- Bookings: update (tourist cancel or organizer manage)
drop policy if exists "bookings_update_owner" on public.bookings;
create policy "bookings_update_owner"
  on public.bookings for update
  to authenticated
  using (
    user_id = auth.uid()
    or lower(contact_email) = lower(
      coalesce(
        (select email from public.profiles where id = auth.uid()),
        ''
      )
    )
    or organizer_user_id = auth.uid()::text
  )
  with check (
    user_id = auth.uid()
    or lower(contact_email) = lower(
      coalesce(
        (select email from public.profiles where id = auth.uid()),
        ''
      )
    )
    or organizer_user_id = auth.uid()::text
  );
