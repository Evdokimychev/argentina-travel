-- E34: Payment platform foundation — transactions, payouts, reconciliation audit
-- Apply via: npm run supabase:migrate

-- ---------------------------------------------------------------------------
-- Payment transactions (charges, refunds, payouts)
-- ---------------------------------------------------------------------------
create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  booking_id text not null references public.bookings (id) on delete cascade,
  provider text not null,
  external_id text,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'USD',
  status text not null default 'pending',
  type text not null,
  source_event_id text,
  requested_by uuid references public.profiles (id) on delete set null,
  approved_by uuid references public.profiles (id) on delete set null,
  request_reason text,
  admin_notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_transactions_provider_check check (
    provider in ('mercadopago', 'stripe', 'manual')
  ),
  constraint payment_transactions_status_check check (
    status in ('pending', 'processing', 'completed', 'failed', 'cancelled', 'rejected')
  ),
  constraint payment_transactions_type_check check (
    type in ('charge', 'refund', 'payout')
  )
);

create index if not exists payment_transactions_booking_id_idx
  on public.payment_transactions (booking_id);

create index if not exists payment_transactions_created_at_idx
  on public.payment_transactions (created_at desc);

create index if not exists payment_transactions_type_status_idx
  on public.payment_transactions (type, status);

create unique index if not exists payment_transactions_provider_external_id_idx
  on public.payment_transactions (provider, external_id)
  where external_id is not null;

drop trigger if exists payment_transactions_set_updated_at on public.payment_transactions;
create trigger payment_transactions_set_updated_at
  before update on public.payment_transactions
  for each row execute function public.set_updated_at();

comment on table public.payment_transactions is
  'Ledger of payment operations: charges, refund requests, payout entries';

-- ---------------------------------------------------------------------------
-- Organizer payout records (stub rows for future settlement)
-- ---------------------------------------------------------------------------
create table if not exists public.payout_records (
  id uuid primary key default gen_random_uuid(),
  organizer_user_id text not null,
  period text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'USD',
  status text not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payout_records_status_check check (
    status in ('pending', 'scheduled', 'paid', 'failed', 'cancelled')
  )
);

create index if not exists payout_records_organizer_idx
  on public.payout_records (organizer_user_id);

create index if not exists payout_records_period_idx
  on public.payout_records (period desc);

drop trigger if exists payout_records_set_updated_at on public.payout_records;
create trigger payout_records_set_updated_at
  before update on public.payout_records
  for each row execute function public.set_updated_at();

comment on table public.payout_records is
  'Organizer settlement periods — stub until payout integration';

-- ---------------------------------------------------------------------------
-- Reconciliation snapshots (admin audit for payment ops)
-- ---------------------------------------------------------------------------
create table if not exists public.payment_audit_log (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null default current_date,
  period text,
  totals jsonb not null default '{}'::jsonb,
  discrepancies jsonb not null default '[]'::jsonb,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists payment_audit_log_snapshot_date_idx
  on public.payment_audit_log (snapshot_date desc);

create index if not exists payment_audit_log_created_at_idx
  on public.payment_audit_log (created_at desc);

comment on table public.payment_audit_log is
  'Reconciliation snapshots and admin payment audit entries';

-- ---------------------------------------------------------------------------
-- Row Level Security — service role only (admin API uses service role)
-- ---------------------------------------------------------------------------
alter table public.payment_transactions enable row level security;
alter table public.payout_records enable row level security;
alter table public.payment_audit_log enable row level security;

-- No public policies: all access via service role in server routes.
