-- Durable client-operation keys prevent duplicate real partner orders after retries.
create table if not exists public.partner_booking_operations (
  provider text not null check (provider in ('tripster', 'youtravel')),
  idempotency_key uuid not null,
  request_fingerprint text not null,
  status text not null default 'pending' check (status in ('pending', 'completed')),
  response_status integer,
  response_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (provider, idempotency_key)
);

drop trigger if exists partner_booking_operations_set_updated_at
  on public.partner_booking_operations;
create trigger partner_booking_operations_set_updated_at
  before update on public.partner_booking_operations
  for each row execute function public.set_updated_at();

create index if not exists partner_booking_operations_created_idx
  on public.partner_booking_operations (created_at desc);

alter table public.partner_booking_operations enable row level security;
revoke all on public.partner_booking_operations from anon, authenticated;
grant select, insert, update, delete on public.partner_booking_operations to service_role;

drop policy if exists "Partner booking operations are service role only"
  on public.partner_booking_operations;
create policy "Partner booking operations are service role only"
  on public.partner_booking_operations
  for all
  to public
  using (false)
  with check (false);

comment on table public.partner_booking_operations is
  'Durable idempotency ledger for real partner booking API calls; service role only.';
