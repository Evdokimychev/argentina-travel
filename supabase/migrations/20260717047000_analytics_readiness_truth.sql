-- Analytics provenance boundary. Existing browser-writable history stays available
-- for forensic use, but can never be silently promoted into a trusted KPI.

alter table public.analytics_events
  add column if not exists ingestion_source text not null default 'legacy_unverified';

alter table public.analytics_events
  drop constraint if exists analytics_events_ingestion_source_check;
alter table public.analytics_events
  add constraint analytics_events_ingestion_source_check
  check (ingestion_source in ('legacy_unverified', 'controlled_server'));

drop policy if exists "analytics_events_anon_insert" on public.analytics_events;
revoke insert on public.analytics_events from anon, authenticated;
grant select, insert on public.analytics_events to service_role;
grant select on public.bookings, public.payment_transactions, public.tourist_reviews to service_role;

create index if not exists analytics_events_trusted_funnel_idx
  on public.analytics_events (event_type, created_at desc)
  where ingestion_source = 'controlled_server';

comment on column public.analytics_events.ingestion_source is
  'Provenance boundary: only events validated by the server writer use controlled_server; historical/direct rows remain legacy_unverified.';

create or replace function public.admin_analytics_funnel_counts(p_since timestamptz default null)
returns table (
  tour_views bigint,
  booking_started bigint,
  confirmed bigint,
  paid bigint,
  review bigint
)
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
  select
    (select count(*)
       from public.analytics_events event
      where event.event_type = 'tour_view'
        and event.ingestion_source = 'controlled_server'
        and (p_since is null or event.created_at >= p_since)) as tour_views,
    (select count(*)
       from public.bookings booking
      where p_since is null or booking.created_at >= p_since) as booking_started,
    (select count(*)
       from public.bookings booking
      where booking.status in ('confirmed', 'completed')
        and (p_since is null or booking.created_at >= p_since)) as confirmed,
    (select count(distinct transaction.booking_id)
       from public.payment_transactions transaction
      where transaction.type = 'charge'
        and transaction.status = 'completed'
        and (p_since is null or transaction.created_at >= p_since)) as paid,
    (select count(*)
       from public.tourist_reviews review
      where review.status = 'published'
        and (p_since is null or review.created_at >= p_since)) as review;
$$;

revoke all on function public.admin_analytics_funnel_counts(timestamptz) from public, anon, authenticated;
grant execute on function public.admin_analytics_funnel_counts(timestamptz) to service_role;

comment on function public.admin_analytics_funnel_counts(timestamptz) is
  'Exact admin funnel snapshot: controlled events, bookings, distinct completed ledger charges, and published reviews.';

create or replace function public.admin_analytics_booking_cohorts(p_since timestamptz default null)
returns table (month_key text, bookings bigint)
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
  select
    to_char(date_trunc('month', booking.created_at at time zone 'UTC'), 'YYYY-MM') as month_key,
    count(*) as bookings
  from public.bookings booking
  where p_since is null or booking.created_at >= p_since
  group by 1
  order by 1;
$$;

revoke all on function public.admin_analytics_booking_cohorts(timestamptz) from public, anon, authenticated;
grant execute on function public.admin_analytics_booking_cohorts(timestamptz) to service_role;
