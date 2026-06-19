-- E76: Affiliate attribution — UTM → booking source

-- ---------------------------------------------------------------------------
-- First-touch attribution per booking
-- ---------------------------------------------------------------------------
create table if not exists public.booking_attribution (
  booking_id text primary key references public.bookings (id) on delete cascade,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referrer text,
  landing_path text,
  api_key_id uuid references public.api_keys (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists booking_attribution_utm_source_idx
  on public.booking_attribution (utm_source)
  where utm_source is not null;

create index if not exists booking_attribution_api_key_idx
  on public.booking_attribution (api_key_id)
  where api_key_id is not null;

comment on table public.booking_attribution is
  'First-touch UTM and referrer captured at checkout (E76)';

-- ---------------------------------------------------------------------------
-- Commission rule override by utm_source (affiliate partners)
-- ---------------------------------------------------------------------------
alter table public.platform_commission_rules
  add column if not exists utm_source_match text;

create unique index if not exists platform_commission_rules_utm_source_idx
  on public.platform_commission_rules (lower(utm_source_match))
  where utm_source_match is not null and active = true;

comment on column public.platform_commission_rules.utm_source_match is
  'When set, this rule applies to bookings with matching booking_attribution.utm_source';

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.booking_attribution enable row level security;

drop policy if exists "booking_attribution_select_organizer" on public.booking_attribution;
create policy "booking_attribution_select_organizer"
  on public.booking_attribution for select
  to authenticated
  using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_attribution.booking_id
        and b.organizer_user_id = auth.uid()::text
    )
  );

drop policy if exists "booking_attribution_select_admin" on public.booking_attribution;
create policy "booking_attribution_select_admin"
  on public.booking_attribution for select
  to authenticated
  using (public.is_admin_with('operations.bookings'));
