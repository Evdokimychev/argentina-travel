-- Atomic finance controls: refund reservations, four-eyes approval and payout CAS.
-- All RPCs are service-role only and write the immutable admin audit log in the
-- same transaction as the financial state change.

-- ---------------------------------------------------------------------------
-- Granular finance capabilities and safe role presets
-- ---------------------------------------------------------------------------
insert into public.admin_role_presets (id, label, description, capabilities)
values
  (
    'finance_operator',
    'Финансовый оператор',
    'Подготавливает возвраты и пакеты выплат, но не может их одобрять',
    array[
      'dashboard.view',
      'finance.view',
      'finance.refunds.prepare',
      'finance.payouts.create',
      'finance.payouts.export',
      'finance.reconciliation'
    ]::text[]
  ),
  (
    'finance_approver',
    'Финансовый контролёр',
    'Одобряет возвраты и выплаты, подготовленные другим сотрудником',
    array[
      'dashboard.view',
      'finance.view',
      'finance.refunds.approve',
      'finance.payouts.approve',
      'finance.payouts.complete',
      'finance.payouts.export'
    ]::text[]
  )
on conflict (id) do update set
  label = excluded.label,
  description = excluded.description,
  capabilities = excluded.capabilities;

update public.admin_role_presets
set capabilities = (
  select array_agg(distinct capability order by capability)
  from unnest(
    capabilities || array[
      'finance.view',
      'finance.refunds.prepare',
      'finance.payouts.create',
      'finance.payouts.export',
      'finance.reconciliation'
    ]::text[]
  ) as capability
)
where id = 'operations_manager';

-- ---------------------------------------------------------------------------
-- Refund reservation and execution ownership
-- ---------------------------------------------------------------------------
alter table public.payment_transactions
  add column if not exists request_idempotency_key uuid;

alter table public.payment_transactions
  add column if not exists source_transaction_id uuid
    references public.payment_transactions (id) on delete restrict;

alter table public.payment_transactions
  add column if not exists claimed_by uuid
    references public.profiles (id) on delete set null;

alter table public.payment_transactions
  add column if not exists claimed_at timestamptz;

create unique index if not exists payment_refund_idempotency_key_idx
  on public.payment_transactions (request_idempotency_key)
  where type = 'refund' and request_idempotency_key is not null;

-- Only one active request can reserve a charge at a time. Completed refunds do
-- not block a later partial refund; the cumulative cap below still applies.
create unique index if not exists payment_refund_active_source_idx
  on public.payment_transactions (source_transaction_id)
  where type = 'refund' and status in ('pending', 'processing');

create index if not exists payment_refund_source_idx
  on public.payment_transactions (source_transaction_id, status)
  where type = 'refund';

create index if not exists payment_refund_requested_by_idx
  on public.payment_transactions (requested_by)
  where type = 'refund' and requested_by is not null;

create index if not exists payment_refund_approved_by_idx
  on public.payment_transactions (approved_by)
  where type = 'refund' and approved_by is not null;

create index if not exists payment_refund_claimed_by_idx
  on public.payment_transactions (claimed_by)
  where type = 'refund' and claimed_by is not null;

comment on column public.payment_transactions.request_idempotency_key is
  'Client operation UUID; retries return the original refund request';
comment on column public.payment_transactions.source_transaction_id is
  'Exact completed charge being refunded';
comment on column public.payment_transactions.claimed_by is
  'Different finance actor who atomically claimed the prepared refund for execution';

create or replace function public.prepare_refund_request_atomic(
  p_booking_id text,
  p_source_transaction_id uuid,
  p_amount numeric,
  p_currency text,
  p_provider text,
  p_requested_by uuid,
  p_request_reason text,
  p_request_idempotency_key uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns public.payment_transactions
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_existing public.payment_transactions%rowtype;
  v_charge public.payment_transactions%rowtype;
  v_reserved numeric(12, 2);
  v_refund public.payment_transactions%rowtype;
begin
  if p_requested_by is null or p_request_idempotency_key is null then
    raise exception using errcode = '22023', message = 'REFUND_ACTOR_AND_IDEMPOTENCY_REQUIRED';
  end if;
  if p_amount is null or p_amount <= 0 or round(p_amount, 2) <> p_amount then
    raise exception using errcode = '22023', message = 'INVALID_REFUND_AMOUNT';
  end if;

  select * into v_existing
  from public.payment_transactions
  where type = 'refund' and request_idempotency_key = p_request_idempotency_key;

  if found then
    if v_existing.booking_id <> p_booking_id
       or v_existing.source_transaction_id is distinct from p_source_transaction_id
       or v_existing.amount <> p_amount
       or v_existing.currency <> upper(p_currency)
       or v_existing.requested_by is distinct from p_requested_by then
      raise exception using errcode = '22023', message = 'IDEMPOTENCY_KEY_REUSED';
    end if;
    return v_existing;
  end if;

  select * into v_charge
  from public.payment_transactions
  where id = p_source_transaction_id
  for update;

  if not found
     or v_charge.type <> 'charge'
     or v_charge.status <> 'completed'
     or v_charge.booking_id <> p_booking_id then
    raise exception using errcode = '22023', message = 'SOURCE_CHARGE_NOT_FOUND';
  end if;
  if v_charge.provider <> p_provider or v_charge.currency <> upper(p_currency) then
    raise exception using errcode = '22023', message = 'SOURCE_CHARGE_MISMATCH';
  end if;

  -- Recheck after the charge lock so concurrent retries cannot both insert.
  select * into v_existing
  from public.payment_transactions
  where type = 'refund' and request_idempotency_key = p_request_idempotency_key;
  if found then
    return v_existing;
  end if;

  select coalesce(sum(amount), 0)::numeric(12, 2) into v_reserved
  from public.payment_transactions
  where type = 'refund'
    and source_transaction_id = p_source_transaction_id
    and status in ('pending', 'processing', 'completed');

  if v_reserved + p_amount > v_charge.amount then
    raise exception using errcode = '22023', message = 'REFUND_EXCEEDS_REMAINING_CHARGE';
  end if;

  insert into public.payment_transactions (
    booking_id, provider, amount, currency, status, type, requested_by,
    request_reason, request_idempotency_key, source_transaction_id, metadata
  ) values (
    p_booking_id, p_provider, p_amount, upper(p_currency), 'pending', 'refund',
    p_requested_by, nullif(btrim(p_request_reason), ''), p_request_idempotency_key,
    p_source_transaction_id,
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('requestCreatedAt', now())
  )
  returning * into v_refund;

  insert into public.admin_audit_log (
    actor_user_id, action, entity_type, entity_id, payload
  ) values (
    p_requested_by,
    'payment.refund_prepared',
    'payment_transaction',
    v_refund.id::text,
    jsonb_build_object(
      'bookingId', p_booking_id,
      'sourceTransactionId', p_source_transaction_id,
      'amount', p_amount,
      'currency', upper(p_currency),
      'operationId', p_request_idempotency_key
    )
  );

  return v_refund;
end;
$$;

create or replace function public.claim_refund_for_execution(
  p_refund_id uuid,
  p_actor_user_id uuid,
  p_admin_notes text default null
)
returns public.payment_transactions
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_refund public.payment_transactions%rowtype;
  v_charge public.payment_transactions%rowtype;
  v_reserved numeric(12, 2);
begin
  select * into v_refund
  from public.payment_transactions
  where id = p_refund_id
  for update;

  if not found or v_refund.type <> 'refund' then
    raise exception using errcode = 'P0002', message = 'REFUND_NOT_FOUND';
  end if;
  if v_refund.status <> 'pending' then
    raise exception using errcode = '40001', message = 'REFUND_NOT_PENDING';
  end if;
  if p_actor_user_id is null or v_refund.requested_by is not distinct from p_actor_user_id then
    raise exception using errcode = '42501', message = 'REFUND_MAKER_CANNOT_APPROVE';
  end if;

  select * into v_charge
  from public.payment_transactions
  where id = v_refund.source_transaction_id
  for update;

  if not found or v_charge.type <> 'charge' or v_charge.status <> 'completed' then
    raise exception using errcode = '22023', message = 'SOURCE_CHARGE_NOT_FOUND';
  end if;

  select coalesce(sum(amount), 0)::numeric(12, 2) into v_reserved
  from public.payment_transactions
  where type = 'refund'
    and source_transaction_id = v_refund.source_transaction_id
    and status in ('pending', 'processing', 'completed');

  if v_reserved > v_charge.amount then
    raise exception using errcode = '22023', message = 'REFUND_EXCEEDS_REMAINING_CHARGE';
  end if;

  update public.payment_transactions
  set status = 'processing',
      claimed_by = p_actor_user_id,
      claimed_at = now(),
      approved_by = p_actor_user_id,
      admin_notes = coalesce(nullif(btrim(p_admin_notes), ''), admin_notes),
      updated_at = now()
  where id = p_refund_id and status = 'pending'
  returning * into v_refund;

  if not found then
    raise exception using errcode = '40001', message = 'REFUND_CLAIM_CONFLICT';
  end if;

  insert into public.admin_audit_log (actor_user_id, action, entity_type, entity_id, payload)
  values (
    p_actor_user_id,
    'payment.refund_claimed',
    'payment_transaction',
    p_refund_id::text,
    jsonb_build_object('previousStatus', 'pending', 'nextStatus', 'processing')
  );

  return v_refund;
end;
$$;

create or replace function public.finalize_refund_attempt(
  p_refund_id uuid,
  p_status text,
  p_external_id text,
  p_metadata jsonb,
  p_booking_fully_refunded boolean default false
)
returns public.payment_transactions
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_refund public.payment_transactions%rowtype;
begin
  if p_status not in ('processing', 'completed', 'failed') then
    raise exception using errcode = '22023', message = 'INVALID_REFUND_FINAL_STATUS';
  end if;

  update public.payment_transactions
  set status = p_status,
      external_id = coalesce(nullif(btrim(p_external_id), ''), external_id),
      metadata = metadata || coalesce(p_metadata, '{}'::jsonb),
      updated_at = now()
  where id = p_refund_id and type = 'refund' and status = 'processing'
  returning * into v_refund;

  if not found then
    raise exception using errcode = '40001', message = 'REFUND_FINALIZE_CONFLICT';
  end if;

  if p_status = 'completed' and p_booking_fully_refunded then
    update public.bookings
    set payment_status = 'refunded', updated_at = now()
    where id = v_refund.booking_id;
  end if;

  insert into public.admin_audit_log (actor_user_id, action, entity_type, entity_id, payload)
  values (
    v_refund.claimed_by,
    'payment.refund_attempt_finalized',
    'payment_transaction',
    p_refund_id::text,
    jsonb_build_object('status', p_status, 'externalId', p_external_id)
  );

  return v_refund;
end;
$$;

create or replace function public.reject_refund_request_atomic(
  p_refund_id uuid,
  p_actor_user_id uuid,
  p_admin_notes text default null
)
returns public.payment_transactions
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_refund public.payment_transactions%rowtype;
begin
  update public.payment_transactions
  set status = 'rejected',
      approved_by = p_actor_user_id,
      admin_notes = coalesce(nullif(btrim(p_admin_notes), ''), admin_notes),
      updated_at = now()
  where id = p_refund_id
    and type = 'refund'
    and status = 'pending'
    and requested_by is distinct from p_actor_user_id
  returning * into v_refund;

  if not found then
    raise exception using errcode = '40001', message = 'REFUND_REJECT_CONFLICT_OR_SAME_ACTOR';
  end if;

  insert into public.admin_audit_log (actor_user_id, action, entity_type, entity_id, payload)
  values (p_actor_user_id, 'payment.refund_rejected', 'payment_transaction', p_refund_id::text, '{}'::jsonb);

  return v_refund;
end;
$$;

-- ---------------------------------------------------------------------------
-- Atomic, single-currency payout batches and four-eyes transitions
-- ---------------------------------------------------------------------------
alter table public.payout_records
  add column if not exists created_by uuid references public.profiles (id) on delete set null;
alter table public.payout_records
  add column if not exists approved_at timestamptz;
alter table public.payout_records
  add column if not exists exported_by uuid references public.profiles (id) on delete set null;
alter table public.payout_records
  add column if not exists completed_by uuid references public.profiles (id) on delete set null;
alter table public.payout_records
  add column if not exists cancelled_by uuid references public.profiles (id) on delete set null;
alter table public.payout_records
  add column if not exists cancelled_at timestamptz;

create index if not exists payout_records_created_by_idx
  on public.payout_records (created_by) where created_by is not null;
create index if not exists payout_records_approved_by_idx
  on public.payout_records (approved_by) where approved_by is not null;
create index if not exists payout_records_exported_by_idx
  on public.payout_records (exported_by) where exported_by is not null;
create index if not exists payout_records_completed_by_idx
  on public.payout_records (completed_by) where completed_by is not null;
create index if not exists payout_records_cancelled_by_idx
  on public.payout_records (cancelled_by) where cancelled_by is not null;

alter table public.payout_records
  drop constraint if exists payout_records_currency_check;
alter table public.payout_records
  add constraint payout_records_currency_check check (currency in ('RUB', 'ARS', 'USD', 'EUR'));

alter table public.payout_records
  drop constraint if exists payout_records_maker_approver_check;
alter table public.payout_records
  add constraint payout_records_maker_approver_check
    check (approved_by is null or created_by is null or approved_by <> created_by);

comment on column public.payout_records.created_by is 'Finance operator who atomically claimed snapshots';
comment on column public.payout_records.approved_by is 'Different finance actor who approved the batch';
comment on column public.payout_records.completed_by is 'Actor who confirmed the external bank transfer';

create or replace function public.create_payout_batch_atomic(
  p_organizer_user_id text,
  p_currency text,
  p_period text,
  p_admin_notes text,
  p_actor_user_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_currency text := upper(p_currency);
  v_snapshot_ids uuid[];
  v_amount numeric(12, 2);
  v_snapshot_count integer;
  v_claimed_count integer;
  v_payout public.payout_records%rowtype;
begin
  if p_actor_user_id is null or nullif(btrim(p_organizer_user_id), '') is null then
    raise exception using errcode = '22023', message = 'PAYOUT_ACTOR_AND_ORGANIZER_REQUIRED';
  end if;
  if v_currency not in ('RUB', 'ARS', 'USD', 'EUR') then
    raise exception using errcode = '22023', message = 'INVALID_PAYOUT_CURRENCY';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_organizer_user_id || ':' || v_currency, 0));

  select array_agg(claimed.id), round(sum(claimed.organizer_net_amount), 2), count(*)
  into v_snapshot_ids, v_amount, v_snapshot_count
  from (
    select id, organizer_net_amount
    from public.booking_commission_snapshots
    where organizer_user_id = p_organizer_user_id
      and currency = v_currency
      and payout_record_id is null
    order by created_at, id
    for update
  ) as claimed;

  if coalesce(v_snapshot_count, 0) = 0 or coalesce(v_amount, 0) <= 0 then
    raise exception using errcode = 'P0002', message = 'NO_PAYOUT_BALANCE';
  end if;

  insert into public.payout_records (
    organizer_user_id, period, amount, currency, status, admin_notes, created_by, metadata
  ) values (
    p_organizer_user_id,
    coalesce(nullif(btrim(p_period), ''), to_char(now() at time zone 'UTC', 'YYYY-MM')),
    v_amount,
    v_currency,
    'pending',
    nullif(btrim(p_admin_notes), ''),
    p_actor_user_id,
    jsonb_build_object('source', 'commission_batch', 'snapshotCount', v_snapshot_count)
  ) returning * into v_payout;

  update public.booking_commission_snapshots
  set payout_record_id = v_payout.id
  where id = any(v_snapshot_ids) and payout_record_id is null;
  get diagnostics v_claimed_count = row_count;

  if v_claimed_count <> v_snapshot_count then
    raise exception using errcode = '40001', message = 'PAYOUT_SNAPSHOT_CLAIM_CONFLICT';
  end if;

  insert into public.admin_audit_log (actor_user_id, action, entity_type, entity_id, payload)
  values (
    p_actor_user_id,
    'payout.batch_created',
    'payout_record',
    v_payout.id::text,
    jsonb_build_object(
      'organizerUserId', p_organizer_user_id,
      'currency', v_currency,
      'amount', v_amount,
      'snapshotCount', v_snapshot_count
    )
  );

  return jsonb_build_object('payoutId', v_payout.id, 'snapshotCount', v_snapshot_count);
end;
$$;

create or replace function public.approve_payout_batch_atomic(
  p_payout_id uuid,
  p_actor_user_id uuid,
  p_admin_notes text default null
)
returns public.payout_records
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_payout public.payout_records%rowtype;
begin
  update public.payout_records
  set status = 'approved',
      approved_by = p_actor_user_id,
      approved_at = now(),
      admin_notes = coalesce(nullif(btrim(p_admin_notes), ''), admin_notes),
      updated_at = now()
  where id = p_payout_id
    and status in ('pending', 'scheduled')
    and created_by is distinct from p_actor_user_id
  returning * into v_payout;

  if not found then
    raise exception using errcode = '40001', message = 'PAYOUT_APPROVAL_CONFLICT_OR_SAME_ACTOR';
  end if;

  insert into public.admin_audit_log (actor_user_id, action, entity_type, entity_id, payload)
  values (p_actor_user_id, 'payout.approved', 'payout_record', p_payout_id::text, jsonb_build_object('status', 'approved'));
  return v_payout;
end;
$$;

create or replace function public.mark_payout_exported_atomic(
  p_payout_id uuid,
  p_actor_user_id uuid,
  p_export_file_hash text
)
returns public.payout_records
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_payout public.payout_records%rowtype;
begin
  if nullif(btrim(p_export_file_hash), '') is null then
    raise exception using errcode = '22023', message = 'EXPORT_HASH_REQUIRED';
  end if;

  update public.payout_records
  set status = 'exported',
      exported_by = p_actor_user_id,
      exported_at = now(),
      export_file_hash = p_export_file_hash,
      updated_at = now()
  where id = p_payout_id and status = 'approved'
  returning * into v_payout;

  if not found then
    raise exception using errcode = '40001', message = 'PAYOUT_EXPORT_CONFLICT';
  end if;

  insert into public.admin_audit_log (actor_user_id, action, entity_type, entity_id, payload)
  values (p_actor_user_id, 'payout.exported', 'payout_record', p_payout_id::text, jsonb_build_object('fileHash', p_export_file_hash));
  return v_payout;
end;
$$;

create or replace function public.complete_payout_batch_atomic(
  p_payout_id uuid,
  p_actor_user_id uuid,
  p_admin_notes text default null
)
returns public.payout_records
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_payout public.payout_records%rowtype;
begin
  update public.payout_records
  set status = 'completed',
      completed_by = p_actor_user_id,
      completed_at = now(),
      admin_notes = coalesce(nullif(btrim(p_admin_notes), ''), admin_notes),
      updated_at = now()
  where id = p_payout_id and status = 'exported'
  returning * into v_payout;

  if not found then
    raise exception using errcode = '40001', message = 'PAYOUT_COMPLETION_CONFLICT';
  end if;

  insert into public.admin_audit_log (actor_user_id, action, entity_type, entity_id, payload)
  values (p_actor_user_id, 'payout.completed', 'payout_record', p_payout_id::text, jsonb_build_object('status', 'completed'));
  return v_payout;
end;
$$;

create or replace function public.cancel_payout_batch_atomic(
  p_payout_id uuid,
  p_actor_user_id uuid,
  p_admin_notes text default null
)
returns public.payout_records
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_payout public.payout_records%rowtype;
  v_previous_status text;
begin
  select * into v_payout
  from public.payout_records
  where id = p_payout_id
  for update;

  if not found or v_payout.status not in ('pending', 'approved') then
    raise exception using errcode = '40001', message = 'PAYOUT_CANCELLATION_CONFLICT';
  end if;
  v_previous_status := v_payout.status;

  update public.booking_commission_snapshots
  set payout_record_id = null
  where payout_record_id = p_payout_id;

  update public.payout_records
  set status = 'cancelled',
      cancelled_by = p_actor_user_id,
      cancelled_at = now(),
      admin_notes = coalesce(nullif(btrim(p_admin_notes), ''), admin_notes),
      updated_at = now()
  where id = p_payout_id and status = v_previous_status
  returning * into v_payout;

  if not found then
    raise exception using errcode = '40001', message = 'PAYOUT_CANCELLATION_CONFLICT';
  end if;

  insert into public.admin_audit_log (actor_user_id, action, entity_type, entity_id, payload)
  values (p_actor_user_id, 'payout.cancelled', 'payout_record', p_payout_id::text, jsonb_build_object('previousStatus', v_previous_status));
  return v_payout;
end;
$$;

-- Data API functions are not public capabilities: only the trusted service-role
-- server client may execute them.
revoke all on function public.prepare_refund_request_atomic(text, uuid, numeric, text, text, uuid, text, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.claim_refund_for_execution(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.finalize_refund_attempt(uuid, text, text, jsonb, boolean) from public, anon, authenticated;
revoke all on function public.reject_refund_request_atomic(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.create_payout_batch_atomic(text, text, text, text, uuid) from public, anon, authenticated;
revoke all on function public.approve_payout_batch_atomic(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.mark_payout_exported_atomic(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.complete_payout_batch_atomic(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.cancel_payout_batch_atomic(uuid, uuid, text) from public, anon, authenticated;

grant execute on function public.prepare_refund_request_atomic(text, uuid, numeric, text, text, uuid, text, uuid, jsonb) to service_role;
grant execute on function public.claim_refund_for_execution(uuid, uuid, text) to service_role;
grant execute on function public.finalize_refund_attempt(uuid, text, text, jsonb, boolean) to service_role;
grant execute on function public.reject_refund_request_atomic(uuid, uuid, text) to service_role;
grant execute on function public.create_payout_batch_atomic(text, text, text, text, uuid) to service_role;
grant execute on function public.approve_payout_batch_atomic(uuid, uuid, text) to service_role;
grant execute on function public.mark_payout_exported_atomic(uuid, uuid, text) to service_role;
grant execute on function public.complete_payout_batch_atomic(uuid, uuid, text) to service_role;
grant execute on function public.cancel_payout_batch_atomic(uuid, uuid, text) to service_role;
