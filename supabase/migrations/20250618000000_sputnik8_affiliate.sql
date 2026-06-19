-- Sputnik8 affiliate catalog mirror + click tracking
-- Apply via: npm run supabase:migrate

-- ---------------------------------------------------------------------------
-- Countries & cities (Argentina sync scope)
-- ---------------------------------------------------------------------------
create table if not exists public.sputnik8_countries (
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

create index if not exists sputnik8_countries_slug_idx on public.sputnik8_countries (slug);

drop trigger if exists sputnik8_countries_set_updated_at on public.sputnik8_countries;
create trigger sputnik8_countries_set_updated_at
  before update on public.sputnik8_countries
  for each row execute function public.set_updated_at();

create table if not exists public.sputnik8_cities (
  id integer primary key,
  country_id integer not null references public.sputnik8_countries (id) on delete cascade,
  slug text not null,
  name_ru text,
  name_en text,
  experience_count integer not null default 0,
  cover_image text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sputnik8_cities_slug_unique unique (slug)
);

create index if not exists sputnik8_cities_country_id_idx on public.sputnik8_cities (country_id);
create index if not exists sputnik8_cities_slug_idx on public.sputnik8_cities (slug);
create index if not exists sputnik8_cities_experience_count_idx on public.sputnik8_cities (experience_count desc);

drop trigger if exists sputnik8_cities_set_updated_at on public.sputnik8_cities;
create trigger sputnik8_cities_set_updated_at
  before update on public.sputnik8_cities
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Products (photos embedded in photos jsonb)
-- ---------------------------------------------------------------------------
create table if not exists public.sputnik8_products (
  id integer primary key,
  slug text not null,
  country_id integer not null references public.sputnik8_countries (id) on delete cascade,
  city_id integer not null references public.sputnik8_cities (id) on delete cascade,
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
  sputnik8_url text not null,
  partner_url text,
  cover_image text,
  photos jsonb not null default '[]'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sputnik8_products_slug_unique unique (slug)
);

create index if not exists sputnik8_products_slug_idx on public.sputnik8_products (slug);
create index if not exists sputnik8_products_city_id_idx on public.sputnik8_products (city_id);
create index if not exists sputnik8_products_country_id_idx on public.sputnik8_products (country_id);
create index if not exists sputnik8_products_rating_idx on public.sputnik8_products (rating desc nulls last);
create index if not exists sputnik8_products_price_value_idx on public.sputnik8_products (price_value nulls last);
create index if not exists sputnik8_products_review_count_idx on public.sputnik8_products (review_count desc);
create index if not exists sputnik8_products_synced_at_idx on public.sputnik8_products (synced_at desc);

drop trigger if exists sputnik8_products_set_updated_at on public.sputnik8_products;
create trigger sputnik8_products_set_updated_at
  before update on public.sputnik8_products
  for each row execute function public.set_updated_at();

comment on table public.sputnik8_products is 'Sputnik8 affiliate catalog mirror — partner_url via Travelpayouts Links API';

-- ---------------------------------------------------------------------------
-- Reviews (optional)
-- ---------------------------------------------------------------------------
create table if not exists public.sputnik8_reviews (
  id integer primary key,
  product_id integer not null references public.sputnik8_products (id) on delete cascade,
  rating numeric(3, 1),
  author_name text,
  review_text text,
  created_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now()
);

create index if not exists sputnik8_reviews_product_id_idx on public.sputnik8_reviews (product_id);
create index if not exists sputnik8_reviews_created_at_idx on public.sputnik8_reviews (created_at desc nulls last);

-- ---------------------------------------------------------------------------
-- Sync runs (service role only)
-- ---------------------------------------------------------------------------
create table if not exists public.sputnik8_sync_runs (
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
  constraint sputnik8_sync_runs_status_check check (
    status in ('running', 'success', 'failed')
  )
);

create index if not exists sputnik8_sync_runs_started_at_idx on public.sputnik8_sync_runs (started_at desc);

-- ---------------------------------------------------------------------------
-- Booking requests (optional analytics)
-- ---------------------------------------------------------------------------
create table if not exists public.sputnik8_booking_requests (
  id uuid primary key default gen_random_uuid(),
  product_id integer references public.sputnik8_products (id) on delete set null,
  product_slug text not null,
  user_id uuid,
  event_id integer,
  event_date date,
  event_time text,
  persons_count integer not null default 1,
  customer_name text,
  customer_email text,
  customer_phone text,
  comment text,
  sputnik8_order_id integer,
  sputnik8_order_url text,
  sputnik8_status text,
  price_snapshot jsonb,
  created_at timestamptz not null default now()
);

create index if not exists sputnik8_booking_requests_product_slug_idx on public.sputnik8_booking_requests (product_slug);
create index if not exists sputnik8_booking_requests_created_at_idx on public.sputnik8_booking_requests (created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.sputnik8_countries enable row level security;
alter table public.sputnik8_cities enable row level security;
alter table public.sputnik8_products enable row level security;
alter table public.sputnik8_reviews enable row level security;
alter table public.sputnik8_sync_runs enable row level security;
alter table public.sputnik8_booking_requests enable row level security;

drop policy if exists "sputnik8_countries_select_public" on public.sputnik8_countries;
create policy "sputnik8_countries_select_public"
  on public.sputnik8_countries for select
  to anon, authenticated
  using (true);

drop policy if exists "sputnik8_cities_select_public" on public.sputnik8_cities;
create policy "sputnik8_cities_select_public"
  on public.sputnik8_cities for select
  to anon, authenticated
  using (true);

drop policy if exists "sputnik8_products_select_public" on public.sputnik8_products;
create policy "sputnik8_products_select_public"
  on public.sputnik8_products for select
  to anon, authenticated
  using (status is null or status = 'published' or status = 'active');

drop policy if exists "sputnik8_reviews_select_public" on public.sputnik8_reviews;
create policy "sputnik8_reviews_select_public"
  on public.sputnik8_reviews for select
  to anon, authenticated
  using (true);

-- Sync/booking tables: no public policies — service role bypasses RLS
