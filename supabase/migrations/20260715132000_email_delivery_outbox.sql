-- Durable transactional email outbox with bounded retries.
create table if not exists public.email_delivery_outbox (
  id uuid primary key default gen_random_uuid(),
  from_email text not null,
  recipients jsonb not null,
  subject text not null,
  html_body text not null,
  text_body text not null,
  headers jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'sending', 'delivered', 'failed', 'dead')),
  attempts integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz,
  last_attempt_at timestamptz,
  delivered_at timestamptz,
  provider_message_id text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists email_delivery_outbox_set_updated_at on public.email_delivery_outbox;
create trigger email_delivery_outbox_set_updated_at
  before update on public.email_delivery_outbox
  for each row execute function public.set_updated_at();

create index if not exists email_delivery_outbox_retry_idx
  on public.email_delivery_outbox (next_attempt_at, created_at)
  where status in ('pending', 'failed');

create index if not exists email_delivery_outbox_retention_idx
  on public.email_delivery_outbox (status, delivered_at, updated_at)
  where status in ('delivered', 'dead');

alter table public.email_delivery_outbox enable row level security;
revoke all on public.email_delivery_outbox from anon, authenticated;
grant select, insert, update, delete on public.email_delivery_outbox to service_role;

drop policy if exists "Email delivery outbox is service role only"
  on public.email_delivery_outbox;
create policy "Email delivery outbox is service role only"
  on public.email_delivery_outbox
  for all
  to public
  using (false)
  with check (false);

comment on table public.email_delivery_outbox is
  'Transactional email payloads and delivery state; service role only; delivered rows retained 30 days and dead rows 90 days.';
