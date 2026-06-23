-- YouTravel.me partner catalog mirror
-- Apply via: npm run supabase:migrate

create table if not exists public.youtravel_tours (
  id bigint primary key,
  slug text not null,
  title text not null,
  country text,
  region text,
  city text,
  status text,
  duration_days integer,
  duration_nights integer,
  rating numeric(4, 2),
  review_count integer not null default 0,
  price_value numeric(12, 2),
  price_currency text,
  price_display text,
  youtravel_url text not null,
  partner_url text,
  cover_image text,
  photos jsonb not null default '[]'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint youtravel_tours_slug_unique unique (slug)
);

create index if not exists youtravel_tours_slug_idx on public.youtravel_tours (slug);
create index if not exists youtravel_tours_country_idx on public.youtravel_tours (country);
create index if not exists youtravel_tours_rating_idx on public.youtravel_tours (rating desc nulls last);
create index if not exists youtravel_tours_price_value_idx on public.youtravel_tours (price_value nulls last);
create index if not exists youtravel_tours_review_count_idx on public.youtravel_tours (review_count desc);
create index if not exists youtravel_tours_synced_at_idx on public.youtravel_tours (synced_at desc);

drop trigger if exists youtravel_tours_set_updated_at on public.youtravel_tours;
create trigger youtravel_tours_set_updated_at
  before update on public.youtravel_tours
  for each row execute function public.set_updated_at();

comment on table public.youtravel_tours is 'YouTravel.me partner tour mirror — partner_url for affiliate tracking';

create table if not exists public.youtravel_offers (
  id bigint primary key,
  tour_id bigint not null references public.youtravel_tours (id) on delete cascade,
  start_date date,
  end_date date,
  price_value numeric(12, 2),
  price_currency text,
  seats_available integer,
  payload jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists youtravel_offers_tour_id_idx on public.youtravel_offers (tour_id);
create index if not exists youtravel_offers_start_date_idx on public.youtravel_offers (start_date);

drop trigger if exists youtravel_offers_set_updated_at on public.youtravel_offers;
create trigger youtravel_offers_set_updated_at
  before update on public.youtravel_offers
  for each row execute function public.set_updated_at();

create table if not exists public.youtravel_sync_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running',
  tours_fetched integer not null default 0,
  tours_upserted integer not null default 0,
  offers_upserted integer not null default 0,
  error_message text,
  payload jsonb not null default '{}'::jsonb
);

create index if not exists youtravel_sync_runs_started_at_idx on public.youtravel_sync_runs (started_at desc);

alter table public.youtravel_tours enable row level security;
alter table public.youtravel_offers enable row level security;
alter table public.youtravel_sync_runs enable row level security;

drop policy if exists youtravel_tours_public_read on public.youtravel_tours;
create policy youtravel_tours_public_read on public.youtravel_tours
  for select using (true);

drop policy if exists youtravel_offers_public_read on public.youtravel_offers;
create policy youtravel_offers_public_read on public.youtravel_offers
  for select using (true);

drop policy if exists youtravel_sync_runs_service_role on public.youtravel_sync_runs;
create policy youtravel_sync_runs_service_role on public.youtravel_sync_runs
  for all using (auth.role() = 'service_role');
