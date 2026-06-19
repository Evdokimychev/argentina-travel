-- E88: Delivery queue for partner webhooks

create table if not exists public.partner_webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  webhook_id uuid not null references public.partner_webhooks (id) on delete cascade,
  event text not null
    check (event in ('booking.created', 'booking.confirmed', 'booking.cancelled')),
  payload jsonb not null,
  status text not null default 'pending'
    check (status in ('pending', 'delivering', 'delivered', 'failed')),
  attempts integer not null default 0
    check (attempts between 0 and 3),
  last_response_status integer,
  last_error text,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists partner_webhook_deliveries_webhook_idx
  on public.partner_webhook_deliveries (webhook_id, created_at desc);

create index if not exists partner_webhook_deliveries_status_idx
  on public.partner_webhook_deliveries (status, created_at desc);

drop trigger if exists partner_webhook_deliveries_set_updated_at on public.partner_webhook_deliveries;
create trigger partner_webhook_deliveries_set_updated_at
  before update on public.partner_webhook_deliveries
  for each row execute function public.set_updated_at();

alter table public.partner_webhook_deliveries enable row level security;

drop policy if exists "partner_webhook_deliveries_organizer_select" on public.partner_webhook_deliveries;
create policy "partner_webhook_deliveries_organizer_select"
  on public.partner_webhook_deliveries
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.partner_webhooks w
      where w.id = partner_webhook_deliveries.webhook_id
        and w.organizer_id = auth.uid()
    )
  );

drop policy if exists "partner_webhook_deliveries_service_all" on public.partner_webhook_deliveries;
create policy "partner_webhook_deliveries_service_all"
  on public.partner_webhook_deliveries
  for all
  to service_role
  using (true)
  with check (true);

comment on table public.partner_webhook_deliveries is
  'Журнал и очередь доставок партнёрских вебхуков (E88).';
