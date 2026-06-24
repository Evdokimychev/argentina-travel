-- Daily Affise conversion/click snapshots for YouTravel affiliate analytics
create table if not exists public.youtravel_affise_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null,
  conversions integer not null default 0,
  clicks integer,
  source text not null default 'affise',
  created_at timestamptz not null default now(),
  constraint youtravel_affise_snapshots_date_source_unique unique (snapshot_date, source)
);

create index if not exists youtravel_affise_snapshots_snapshot_date_idx
  on public.youtravel_affise_snapshots (snapshot_date desc);

alter table public.youtravel_affise_snapshots enable row level security;

drop policy if exists youtravel_affise_snapshots_service_role on public.youtravel_affise_snapshots;
create policy youtravel_affise_snapshots_service_role on public.youtravel_affise_snapshots
  for all using (auth.role() = 'service_role');

comment on table public.youtravel_affise_snapshots is
  'Daily Affise affiliate stats snapshots for YouTravel.me — populated by /api/cron/youtravel-affise-snapshot';
