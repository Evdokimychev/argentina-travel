-- Minimal lead capture schema for «Пора в Аргентину»
-- Apply via Supabase Dashboard → SQL, or: supabase db push (with linked project)

-- ---------------------------------------------------------------------------
-- Newsletter
-- ---------------------------------------------------------------------------
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  locale text,
  source text not null default 'footer',
  status text not null default 'active' check (status in ('active', 'unsubscribed')),
  created_at timestamptz not null default now(),
  constraint newsletter_subscribers_email_unique unique (email)
);

comment on table public.newsletter_subscribers is
  'Footer and future newsletter signup forms';

-- ---------------------------------------------------------------------------
-- Contact / consultation / feedback / organizer applications
-- ---------------------------------------------------------------------------
create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (
    kind in (
      'general',
      'tour_inquiry',
      'service_request',
      'product_inquiry',
      'organizer_application',
      'consultation'
    )
  ),
  name text not null,
  email text,
  phone text,
  message text not null default '',
  context jsonb not null default '{}'::jsonb,
  page_url text,
  created_at timestamptz not null default now()
);

comment on table public.contact_submissions is
  'Unified inbox: contacts page, service requests, tour questions, organizer join form';

create index if not exists contact_submissions_kind_created_at_idx
  on public.contact_submissions (kind, created_at desc);

create index if not exists contact_submissions_created_at_idx
  on public.contact_submissions (created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security — anonymous insert only, no public reads
-- ---------------------------------------------------------------------------
alter table public.newsletter_subscribers enable row level security;
alter table public.contact_submissions enable row level security;

drop policy if exists "newsletter_anon_insert" on public.newsletter_subscribers;
create policy "newsletter_anon_insert"
  on public.newsletter_subscribers
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "contact_anon_insert" on public.contact_submissions;
create policy "contact_anon_insert"
  on public.contact_submissions
  for insert
  to anon, authenticated
  with check (true);

-- Staff reads via service role or future admin role policies
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
-- Phase 3: Shop orders (PDF guides)
-- Apply via: npm run supabase:migrate

create table if not exists public.shop_orders (
  id text primary key,
  user_id uuid references auth.users (id) on delete set null,
  guest_email text,
  product_id text not null,
  product_slug text not null,
  product_title text not null,
  price_usd numeric(12, 2) not null default 0,
  currency text not null default 'USD',
  status text not null default 'pending',
  payment_status text not null default 'pending',
  customer_name text not null default '',
  customer_email text not null,
  customer_phone text not null default '',
  delivery_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shop_orders_status_check check (
    status in ('pending', 'awaiting_payment', 'paid', 'delivered', 'cancelled')
  ),
  constraint shop_orders_payment_status_check check (
    payment_status in ('pending', 'paid', 'refunded')
  )
);

create index if not exists shop_orders_user_id_idx on public.shop_orders (user_id);
create index if not exists shop_orders_guest_email_idx on public.shop_orders (lower(guest_email));
create index if not exists shop_orders_customer_email_idx on public.shop_orders (lower(customer_email));
create index if not exists shop_orders_product_slug_idx on public.shop_orders (product_slug);
create index if not exists shop_orders_created_at_idx on public.shop_orders (created_at desc);

drop trigger if exists shop_orders_set_updated_at on public.shop_orders;
create trigger shop_orders_set_updated_at
  before update on public.shop_orders
  for each row execute function public.set_updated_at();

comment on table public.shop_orders is 'Digital shop orders — manual payment and PDF delivery';

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.shop_orders enable row level security;

drop policy if exists "shop_orders_insert_authenticated" on public.shop_orders;
create policy "shop_orders_insert_authenticated"
  on public.shop_orders for insert
  to authenticated
  with check (
    user_id = auth.uid()
    or (user_id is null and guest_email is not null)
  );

drop policy if exists "shop_orders_insert_guest" on public.shop_orders;
create policy "shop_orders_insert_guest"
  on public.shop_orders for insert
  to anon
  with check (user_id is null and guest_email is not null);

drop policy if exists "shop_orders_select_owner" on public.shop_orders;
create policy "shop_orders_select_owner"
  on public.shop_orders for select
  to authenticated
  using (
    user_id = auth.uid()
    or lower(customer_email) = lower(
      coalesce(
        (select email from public.profiles where id = auth.uid()),
        ''
      )
    )
    or lower(guest_email) = lower(
      coalesce(
        (select email from public.profiles where id = auth.uid()),
        ''
      )
    )
  );
-- Phase 4: Published tours content (CMS mirror for public catalog)
-- Apply via: npm run supabase:migrate

create table if not exists public.tours (
  id text primary key,
  slug text not null unique,
  owner_user_id text not null,
  status text not null default 'draft',
  title text not null,
  listing jsonb,
  payload jsonb not null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tours_status_check check (
    status in ('draft', 'published', 'archived')
  )
);

create index if not exists tours_slug_idx on public.tours (slug);
create index if not exists tours_owner_user_id_idx on public.tours (owner_user_id);
create index if not exists tours_status_idx on public.tours (status);
create index if not exists tours_published_at_idx on public.tours (published_at desc nulls last);
create index if not exists tours_created_at_idx on public.tours (created_at desc);

drop trigger if exists tours_set_updated_at on public.tours;
create trigger tours_set_updated_at
  before update on public.tours
  for each row execute function public.set_updated_at();

comment on table public.tours is 'Published tour catalog mirror — canonical Tour JSON in payload';

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.tours enable row level security;

drop policy if exists "tours_select_published" on public.tours;
create policy "tours_select_published"
  on public.tours for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "tours_select_owner" on public.tours;
create policy "tours_select_owner"
  on public.tours for select
  to authenticated
  using (owner_user_id = auth.uid()::text);

drop policy if exists "tours_insert_owner" on public.tours;
create policy "tours_insert_owner"
  on public.tours for insert
  to authenticated
  with check (owner_user_id = auth.uid()::text);

drop policy if exists "tours_update_owner" on public.tours;
create policy "tours_update_owner"
  on public.tours for update
  to authenticated
  using (owner_user_id = auth.uid()::text)
  with check (owner_user_id = auth.uid()::text);

drop policy if exists "tours_delete_owner" on public.tours;
create policy "tours_delete_owner"
  on public.tours for delete
  to authenticated
  using (owner_user_id = auth.uid()::text);
-- Tripster affiliate catalog mirror + click tracking
-- Apply via: npm run supabase:migrate

-- ---------------------------------------------------------------------------
-- Countries & cities (Argentina sync scope)
-- ---------------------------------------------------------------------------
create table if not exists public.tripster_countries (
  id integer primary key,
  slug text,
  name_ru text,
  name_en text,
  currency text,
  experience_count integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tripster_countries_slug_idx on public.tripster_countries (slug);

drop trigger if exists tripster_countries_set_updated_at on public.tripster_countries;
create trigger tripster_countries_set_updated_at
  before update on public.tripster_countries
  for each row execute function public.set_updated_at();

create table if not exists public.tripster_cities (
  id integer primary key,
  country_id integer not null references public.tripster_countries (id) on delete cascade,
  slug text not null,
  name_ru text,
  name_en text,
  experience_count integer not null default 0,
  cover_image text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tripster_cities_slug_unique unique (slug)
);

create index if not exists tripster_cities_country_id_idx on public.tripster_cities (country_id);
create index if not exists tripster_cities_slug_idx on public.tripster_cities (slug);
create index if not exists tripster_cities_experience_count_idx on public.tripster_cities (experience_count desc);

drop trigger if exists tripster_cities_set_updated_at on public.tripster_cities;
create trigger tripster_cities_set_updated_at
  before update on public.tripster_cities
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Experiences (photos embedded in photos jsonb)
-- ---------------------------------------------------------------------------
create table if not exists public.tripster_experiences (
  id integer primary key,
  slug text not null,
  country_id integer not null references public.tripster_countries (id) on delete cascade,
  city_id integer not null references public.tripster_cities (id) on delete cascade,
  title text not null,
  tagline text,
  annotation text,
  description text,
  status text,
  experience_type text,
  format text,
  duration_minutes integer,
  rating numeric(4, 2),
  review_count integer not null default 0,
  price_value numeric(12, 2),
  price_currency text,
  price_display text,
  tripster_url text not null,
  partner_url text,
  cover_image text,
  photos jsonb not null default '[]'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tripster_experiences_slug_unique unique (slug)
);

create index if not exists tripster_experiences_slug_idx on public.tripster_experiences (slug);
create index if not exists tripster_experiences_city_id_idx on public.tripster_experiences (city_id);
create index if not exists tripster_experiences_country_id_idx on public.tripster_experiences (country_id);
create index if not exists tripster_experiences_rating_idx on public.tripster_experiences (rating desc nulls last);
create index if not exists tripster_experiences_price_value_idx on public.tripster_experiences (price_value nulls last);
create index if not exists tripster_experiences_review_count_idx on public.tripster_experiences (review_count desc);
create index if not exists tripster_experiences_synced_at_idx on public.tripster_experiences (synced_at desc);

drop trigger if exists tripster_experiences_set_updated_at on public.tripster_experiences;
create trigger tripster_experiences_set_updated_at
  before update on public.tripster_experiences
  for each row execute function public.set_updated_at();

comment on table public.tripster_experiences is 'Tripster affiliate catalog mirror — partner_url via Travelpayouts Links API';

-- ---------------------------------------------------------------------------
-- Sync runs (service role only)
-- ---------------------------------------------------------------------------
create table if not exists public.tripster_sync_runs (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'running',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  cities_synced integer not null default 0,
  experiences_synced integer not null default 0,
  experiences_created integer not null default 0,
  experiences_updated integer not null default 0,
  error_message text,
  log jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint tripster_sync_runs_status_check check (
    status in ('running', 'success', 'failed')
  )
);

create index if not exists tripster_sync_runs_started_at_idx on public.tripster_sync_runs (started_at desc);

-- ---------------------------------------------------------------------------
-- Affiliate click tracking
-- ---------------------------------------------------------------------------
create table if not exists public.affiliate_link_clicks (
  id uuid primary key default gen_random_uuid(),
  experience_id integer references public.tripster_experiences (id) on delete set null,
  experience_slug text not null,
  partner_url text not null,
  referer text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists affiliate_link_clicks_experience_slug_idx on public.affiliate_link_clicks (experience_slug);
create index if not exists affiliate_link_clicks_created_at_idx on public.affiliate_link_clicks (created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.tripster_countries enable row level security;
alter table public.tripster_cities enable row level security;
alter table public.tripster_experiences enable row level security;
alter table public.tripster_sync_runs enable row level security;
alter table public.affiliate_link_clicks enable row level security;

-- Public catalog read
drop policy if exists "tripster_countries_select_public" on public.tripster_countries;
create policy "tripster_countries_select_public"
  on public.tripster_countries for select
  to anon, authenticated
  using (true);

drop policy if exists "tripster_cities_select_public" on public.tripster_cities;
create policy "tripster_cities_select_public"
  on public.tripster_cities for select
  to anon, authenticated
  using (true);

drop policy if exists "tripster_experiences_select_public" on public.tripster_experiences;
create policy "tripster_experiences_select_public"
  on public.tripster_experiences for select
  to anon, authenticated
  using (status is null or status = 'published' or status = 'active');

-- Sync tables: no public policies — service role bypasses RLS
