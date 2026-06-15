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
