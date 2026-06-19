-- E88: Partner webhooks for booking lifecycle events

create table if not exists public.partner_webhooks (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  url text not null,
  secret text not null,
  events text[] not null default array['booking.created', 'booking.confirmed', 'booking.cancelled']::text[]
    check (
      events <@ array['booking.created', 'booking.confirmed', 'booking.cancelled']::text[]
      and array_length(events, 1) is not null
    ),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists partner_webhooks_organizer_idx
  on public.partner_webhooks (organizer_id);

create index if not exists partner_webhooks_organizer_active_idx
  on public.partner_webhooks (organizer_id, active)
  where active = true;

drop trigger if exists partner_webhooks_set_updated_at on public.partner_webhooks;
create trigger partner_webhooks_set_updated_at
  before update on public.partner_webhooks
  for each row execute function public.set_updated_at();

alter table public.partner_webhooks enable row level security;

drop policy if exists "partner_webhooks_organizer_select" on public.partner_webhooks;
create policy "partner_webhooks_organizer_select"
  on public.partner_webhooks
  for select
  to authenticated
  using (organizer_id = auth.uid());

drop policy if exists "partner_webhooks_organizer_insert" on public.partner_webhooks;
create policy "partner_webhooks_organizer_insert"
  on public.partner_webhooks
  for insert
  to authenticated
  with check (organizer_id = auth.uid());

drop policy if exists "partner_webhooks_organizer_update" on public.partner_webhooks;
create policy "partner_webhooks_organizer_update"
  on public.partner_webhooks
  for update
  to authenticated
  using (organizer_id = auth.uid())
  with check (organizer_id = auth.uid());

drop policy if exists "partner_webhooks_organizer_delete" on public.partner_webhooks;
create policy "partner_webhooks_organizer_delete"
  on public.partner_webhooks
  for delete
  to authenticated
  using (organizer_id = auth.uid());

drop policy if exists "partner_webhooks_service_all" on public.partner_webhooks;
create policy "partner_webhooks_service_all"
  on public.partner_webhooks
  for all
  to service_role
  using (true)
  with check (true);

comment on table public.partner_webhooks is
  'Партнёрские вебхуки организаторов для событий бронирований (E88).';
