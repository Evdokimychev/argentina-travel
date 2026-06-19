-- E42: Platform commission rules, booking snapshots, payout batch linkage

-- ---------------------------------------------------------------------------
-- Commission rules (percent or fixed per booking charge)
-- ---------------------------------------------------------------------------
create table if not exists public.platform_commission_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rule_type text not null,
  percent_value numeric(5, 2),
  fixed_amount numeric(12, 2),
  fixed_currency text not null default 'USD',
  is_default boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_commission_rules_rule_type_check check (
    rule_type in ('percent', 'fixed')
  ),
  constraint platform_commission_rules_percent_check check (
    percent_value is null or (percent_value >= 0 and percent_value <= 100)
  ),
  constraint platform_commission_rules_fixed_check check (
    fixed_amount is null or fixed_amount >= 0
  )
);

create unique index if not exists platform_commission_rules_default_idx
  on public.platform_commission_rules (is_default)
  where is_default = true and active = true;

drop trigger if exists platform_commission_rules_set_updated_at on public.platform_commission_rules;
create trigger platform_commission_rules_set_updated_at
  before update on public.platform_commission_rules
  for each row execute function public.set_updated_at();

comment on table public.platform_commission_rules is
  'Platform commission rules applied to organizer payouts (percent or fixed)';

-- Default rule: 10% platform commission
insert into public.platform_commission_rules (
  name,
  rule_type,
  percent_value,
  is_default,
  active
)
select 'Стандартная комиссия 10%', 'percent', 10.00, true, true
where not exists (
  select 1 from public.platform_commission_rules where is_default = true
);

-- ---------------------------------------------------------------------------
-- Commission snapshot per completed charge (idempotent on payment_transaction)
-- ---------------------------------------------------------------------------
create table if not exists public.booking_commission_snapshots (
  id uuid primary key default gen_random_uuid(),
  booking_id text not null references public.bookings (id) on delete cascade,
  payment_transaction_id uuid not null references public.payment_transactions (id) on delete cascade,
  organizer_user_id text not null,
  gross_amount numeric(12, 2) not null check (gross_amount >= 0),
  commission_amount numeric(12, 2) not null check (commission_amount >= 0),
  organizer_net_amount numeric(12, 2) not null check (organizer_net_amount >= 0),
  commission_rule_id uuid references public.platform_commission_rules (id) on delete set null,
  commission_percent numeric(5, 2),
  commission_fixed numeric(12, 2),
  currency text not null default 'USD',
  payout_record_id uuid references public.payout_records (id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists booking_commission_snapshots_tx_idx
  on public.booking_commission_snapshots (payment_transaction_id);

create index if not exists booking_commission_snapshots_organizer_idx
  on public.booking_commission_snapshots (organizer_user_id, created_at desc);

create index if not exists booking_commission_snapshots_payout_idx
  on public.booking_commission_snapshots (payout_record_id)
  where payout_record_id is not null;

comment on table public.booking_commission_snapshots is
  'Frozen commission split created when a charge is completed';

-- ---------------------------------------------------------------------------
-- Payout records — admin completion fields
-- ---------------------------------------------------------------------------
alter table public.payout_records
  add column if not exists approved_by uuid references public.profiles (id) on delete set null;

alter table public.payout_records
  add column if not exists completed_at timestamptz;

alter table public.payout_records
  add column if not exists admin_notes text;

comment on column public.payout_records.approved_by is
  'Admin who marked payout as completed (manual settlement, no bank API)';

-- ---------------------------------------------------------------------------
-- Row Level Security — service role only
-- ---------------------------------------------------------------------------
alter table public.platform_commission_rules enable row level security;
alter table public.booking_commission_snapshots enable row level security;

-- Organizers read own commission snapshots and payout records
drop policy if exists "booking_commission_snapshots_select_organizer" on public.booking_commission_snapshots;
create policy "booking_commission_snapshots_select_organizer"
  on public.booking_commission_snapshots for select
  to authenticated
  using (organizer_user_id = auth.uid()::text);

drop policy if exists "payout_records_select_organizer" on public.payout_records;
create policy "payout_records_select_organizer"
  on public.payout_records for select
  to authenticated
  using (organizer_user_id = auth.uid()::text);

drop policy if exists "platform_commission_rules_select_active" on public.platform_commission_rules;
create policy "platform_commission_rules_select_active"
  on public.platform_commission_rules for select
  to authenticated
  using (active = true);
