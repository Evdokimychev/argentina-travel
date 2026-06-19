-- E47: Analytics events for funnel tracking (tour views, etc.)

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  tour_slug text,
  tour_id text,
  user_id uuid references public.profiles (id) on delete set null,
  session_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

comment on table public.analytics_events is
  'Продуктовые события для воронок и когорт (просмотры туров и др.).';

create index if not exists analytics_events_type_created_at_idx
  on public.analytics_events (event_type, created_at desc);

create index if not exists analytics_events_tour_slug_created_at_idx
  on public.analytics_events (tour_slug, created_at desc)
  where tour_slug is not null;

alter table public.analytics_events enable row level security;

drop policy if exists "analytics_events_anon_insert" on public.analytics_events;
create policy "analytics_events_anon_insert"
  on public.analytics_events
  for insert
  to anon, authenticated
  with check (event_type in ('tour_view', 'booking_started'));

drop policy if exists "analytics_events_service_select" on public.analytics_events;
create policy "analytics_events_service_select"
  on public.analytics_events
  for select
  to service_role
  using (true);
