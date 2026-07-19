-- Atomic owner operations for tour bookings and shop orders.
-- Payment truth remains owned by verified payment integrations: these admin RPCs
-- never mutate payment_status and cannot mark an unpaid order as paid.

alter table public.bookings
  add column if not exists operation_version bigint not null default 1;

alter table public.shop_orders
  add column if not exists operation_version bigint not null default 1;

alter table public.bookings
  drop constraint if exists bookings_operation_version_positive;
alter table public.bookings
  add constraint bookings_operation_version_positive check (operation_version > 0);

alter table public.shop_orders
  drop constraint if exists shop_orders_operation_version_positive;
alter table public.shop_orders
  add constraint shop_orders_operation_version_positive check (operation_version > 0);

alter table public.shop_orders
  drop constraint if exists shop_orders_fulfilment_payment_truth;
alter table public.shop_orders
  add constraint shop_orders_fulfilment_payment_truth check (
    (status <> 'paid' or payment_status in ('paid', 'refunded'))
    and (status <> 'delivered' or payment_status in ('paid', 'refunded'))
  ) not valid;

create table if not exists public.operations_transition_outbox (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('booking', 'shop_order')),
  entity_id text not null,
  event_key text not null check (
    event_key in ('booking.status_changed', 'shop_order.status_changed')
  ),
  recipient_kind text not null check (recipient_kind in ('customer', 'organizer', 'admin')),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'delivered', 'failed', 'dead')),
  payload jsonb not null default '{}'::jsonb,
  dedupe_key text not null check (length(dedupe_key) between 12 and 240),
  attempts integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dedupe_key, recipient_kind),
  check (not (payload ?| array[
    'contactEmail', 'contactPhone', 'contactName', 'customerEmail',
    'customerPhone', 'customerName', 'deliveryUrl', 'notes', 'token', 'apiKey'
  ]))
);

drop trigger if exists operations_transition_outbox_set_updated_at
  on public.operations_transition_outbox;
create trigger operations_transition_outbox_set_updated_at
  before update on public.operations_transition_outbox
  for each row execute function public.set_updated_at();

create index if not exists operations_transition_outbox_retry_idx
  on public.operations_transition_outbox(next_attempt_at, created_at)
  where status in ('pending', 'failed');

create index if not exists operations_transition_outbox_entity_idx
  on public.operations_transition_outbox(entity_type, entity_id, created_at desc);

alter table public.operations_transition_outbox enable row level security;
revoke all on public.operations_transition_outbox from public, anon, authenticated;
grant select, insert, update, delete on public.operations_transition_outbox to service_role;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.bump_operation_version_on_payment_change()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if new.payment_status is distinct from old.payment_status
     and new.operation_version = old.operation_version then
    new.operation_version := old.operation_version + 1;
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_bump_operation_version_on_payment on public.bookings;
create trigger bookings_bump_operation_version_on_payment
  before update of payment_status on public.bookings
  for each row execute function private.bump_operation_version_on_payment_change();

drop trigger if exists shop_orders_bump_operation_version_on_payment on public.shop_orders;
create trigger shop_orders_bump_operation_version_on_payment
  before update of payment_status on public.shop_orders
  for each row execute function private.bump_operation_version_on_payment_change();

revoke execute on function private.bump_operation_version_on_payment_change()
  from public, anon, authenticated;

create or replace function private.admin_operations_actor_allowed(
  p_actor_user_id uuid,
  p_capability text
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.profiles profile
    join public.admin_staff staff on staff.user_id = profile.id
    where profile.id = p_actor_user_id
      and profile.roles @> array['admin']::text[]
      and not coalesce(profile.is_blocked, false)
      and staff.is_active = true
      and ('*' = any(staff.capabilities) or p_capability = any(staff.capabilities))
  );
$$;

revoke execute on function private.admin_operations_actor_allowed(uuid, text)
  from public, anon, authenticated, service_role;

create or replace function public.admin_transition_booking_atomic(
  p_booking_id text,
  p_expected_version bigint,
  p_actor_user_id uuid,
  p_next_status text,
  p_note text default null,
  p_ip_address text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_booking public.bookings%rowtype;
  v_updated public.bookings%rowtype;
  v_previous_status text;
  v_note text := nullif(left(btrim(coalesce(p_note, '')), 1000), '');
  v_payload jsonb;
  v_now timestamptz := clock_timestamp();
  v_dedupe_key text;
begin
  if not private.admin_operations_actor_allowed(p_actor_user_id, 'operations.bookings') then
    raise exception 'BOOKING_ADMIN_REQUIRED' using errcode = '42501';
  end if;

  select * into v_booking
  from public.bookings
  where id = p_booking_id
  for update;
  if not found then
    raise exception 'BOOKING_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_booking.operation_version <> p_expected_version then
    raise exception 'BOOKING_CONFLICT' using errcode = '40001';
  end if;

  v_previous_status := v_booking.status;
  if p_next_status = v_previous_status then
    return v_booking;
  end if;
  if p_next_status = 'paid' then
    raise exception 'BOOKING_PAID_STATUS_PAYMENT_OWNED' using errcode = '42501';
  end if;
  if not (
    (v_previous_status = 'new' and p_next_status in ('pending', 'confirmed', 'cancelled'))
    or (v_previous_status = 'pending' and p_next_status in ('confirmed', 'cancelled'))
    or (v_previous_status = 'confirmed' and p_next_status in ('waiting_payment', 'completed', 'cancelled'))
    or (
      v_previous_status = 'waiting_payment'
      and p_next_status = 'completed'
      and v_booking.payment_status = 'paid'
    )
    or (v_previous_status = 'waiting_payment' and p_next_status = 'cancelled')
    or (v_previous_status = 'paid' and p_next_status in ('completed', 'cancelled'))
  ) then
    raise exception 'BOOKING_INVALID_TRANSITION' using errcode = '23514';
  end if;

  v_payload := jsonb_set(
    coalesce(v_booking.payload, '{}'::jsonb),
    '{statusHistory}',
    coalesce(v_booking.payload->'statusHistory', '[]'::jsonb) || jsonb_build_array(
      jsonb_strip_nulls(jsonb_build_object(
        'id', 'status-admin-' || gen_random_uuid()::text,
        'from', v_previous_status,
        'to', p_next_status,
        'changedAt', v_now,
        'changedBy', 'system',
        'note', coalesce(v_note, 'Изменено администратором')
      ))
    ),
    true
  );

  if p_next_status = 'cancelled' then
    perform public.cancel_booking_with_reservation_release(
      v_booking.id,
      v_booking.updated_at,
      v_payload,
      v_now
    );
    update public.bookings
    set operation_version = v_booking.operation_version + 1
    where id = v_booking.id
    returning * into v_updated;
  else
    update public.bookings
    set status = p_next_status,
        payload = v_payload,
        operation_version = v_booking.operation_version + 1,
        updated_at = v_now
    where id = v_booking.id
      and operation_version = p_expected_version
    returning * into v_updated;
  end if;

  if v_updated.id is null then
    raise exception 'BOOKING_CONFLICT' using errcode = '40001';
  end if;

  insert into public.admin_audit_log(
    actor_user_id, action, entity_type, entity_id, payload, ip_address
  ) values (
    p_actor_user_id,
    'booking.status_changed',
    'booking',
    v_booking.id,
    jsonb_build_object(
      'fromStatus', v_previous_status,
      'toStatus', p_next_status,
      'operationVersion', v_updated.operation_version,
      'noteProvided', v_note is not null,
      'paymentStatusPreserved', v_booking.payment_status,
      'reservationReleased', p_next_status = 'cancelled'
    ),
    p_ip_address
  );

  v_dedupe_key := 'booking:' || v_booking.id || ':status:' || v_updated.operation_version::text;
  insert into public.operations_transition_outbox(
    entity_type, entity_id, event_key, recipient_kind, payload, dedupe_key
  )
  select
    'booking',
    v_booking.id,
    'booking.status_changed',
    recipient_kind,
    jsonb_build_object(
      'fromStatus', v_previous_status,
      'toStatus', p_next_status,
      'operationVersion', v_updated.operation_version,
      'tourTitle', v_booking.tour_title
    ),
    v_dedupe_key
  from unnest(array['customer', 'organizer']::text[]) as recipient_kind;

  return v_updated;
end;
$$;

create or replace function public.admin_transition_shop_order_atomic(
  p_order_id text,
  p_expected_version bigint,
  p_actor_user_id uuid,
  p_next_status text,
  p_delivery_url text,
  p_notes text,
  p_ip_address text default null
)
returns public.shop_orders
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_order public.shop_orders%rowtype;
  v_updated public.shop_orders%rowtype;
  v_previous_status text;
  v_delivery_url text := nullif(btrim(coalesce(p_delivery_url, '')), '');
  v_notes text := nullif(left(btrim(coalesce(p_notes, '')), 2000), '');
  v_status_changed boolean;
  v_dedupe_key text;
begin
  if not private.admin_operations_actor_allowed(p_actor_user_id, 'operations.shop') then
    raise exception 'SHOP_ORDER_ADMIN_REQUIRED' using errcode = '42501';
  end if;

  select * into v_order
  from public.shop_orders
  where id = p_order_id
  for update;
  if not found then
    raise exception 'SHOP_ORDER_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_order.operation_version <> p_expected_version then
    raise exception 'SHOP_ORDER_CONFLICT' using errcode = '40001';
  end if;
  if p_next_status not in ('pending', 'awaiting_payment', 'paid', 'delivered', 'cancelled') then
    raise exception 'SHOP_ORDER_INVALID_STATUS' using errcode = '22023';
  end if;
  if v_delivery_url is not null and (
    length(v_delivery_url) > 2048 or v_delivery_url !~ '^https://'
  ) then
    raise exception 'SHOP_ORDER_INVALID_DELIVERY_URL' using errcode = '22023';
  end if;

  v_previous_status := v_order.status;
  v_status_changed := p_next_status <> v_previous_status;
  if v_status_changed and not (
    (v_previous_status = 'pending' and p_next_status = 'awaiting_payment')
    or (
      v_previous_status = 'pending'
      and p_next_status = 'cancelled'
      and v_order.payment_status in ('pending', 'refunded')
    )
    or (
      v_previous_status = 'awaiting_payment'
      and p_next_status = 'paid'
      and v_order.payment_status = 'paid'
    )
    or (
      v_previous_status = 'awaiting_payment'
      and p_next_status = 'cancelled'
      and v_order.payment_status in ('pending', 'refunded')
    )
    or (v_previous_status = 'paid' and p_next_status = 'delivered')
    or (
      v_previous_status in ('paid', 'delivered')
      and p_next_status = 'cancelled'
      and v_order.payment_status = 'refunded'
    )
  ) then
    if p_next_status in ('paid', 'delivered') and v_order.payment_status <> 'paid' then
      raise exception 'SHOP_ORDER_PAYMENT_NOT_VERIFIED' using errcode = '42501';
    end if;
    if p_next_status = 'cancelled' and v_order.payment_status = 'paid' then
      raise exception 'SHOP_ORDER_REFUND_REQUIRED' using errcode = '42501';
    end if;
    raise exception 'SHOP_ORDER_INVALID_TRANSITION' using errcode = '23514';
  end if;

  if not v_status_changed
     and v_order.delivery_url is not distinct from v_delivery_url
     and v_order.notes is not distinct from v_notes then
    return v_order;
  end if;

  update public.shop_orders
  set status = p_next_status,
      delivery_url = v_delivery_url,
      notes = v_notes,
      operation_version = v_order.operation_version + 1,
      updated_at = clock_timestamp()
  where id = v_order.id
    and operation_version = p_expected_version
  returning * into v_updated;
  if v_updated.id is null then
    raise exception 'SHOP_ORDER_CONFLICT' using errcode = '40001';
  end if;

  insert into public.admin_audit_log(
    actor_user_id, action, entity_type, entity_id, payload, ip_address
  ) values (
    p_actor_user_id,
    case when v_status_changed then 'shop_order.status_changed' else 'shop_order.details_updated' end,
    'shop_order',
    v_order.id,
    jsonb_build_object(
      'fromStatus', v_previous_status,
      'toStatus', p_next_status,
      'operationVersion', v_updated.operation_version,
      'paymentStatusPreserved', v_order.payment_status,
      'deliveryUrlChanged', v_order.delivery_url is distinct from v_delivery_url,
      'notesChanged', v_order.notes is distinct from v_notes
    ),
    p_ip_address
  );

  if v_status_changed then
    v_dedupe_key := 'shop-order:' || v_order.id || ':status:' || v_updated.operation_version::text;
    insert into public.operations_transition_outbox(
      entity_type, entity_id, event_key, recipient_kind, payload, dedupe_key
    ) values (
      'shop_order',
      v_order.id,
      'shop_order.status_changed',
      'customer',
      jsonb_build_object(
        'fromStatus', v_previous_status,
        'toStatus', p_next_status,
        'operationVersion', v_updated.operation_version,
        'productTitle', v_order.product_title
      ),
      v_dedupe_key
    );
  end if;

  return v_updated;
end;
$$;

revoke all on function public.admin_transition_booking_atomic(
  text, bigint, uuid, text, text, text
) from public, anon, authenticated;
grant execute on function public.admin_transition_booking_atomic(
  text, bigint, uuid, text, text, text
) to service_role;

revoke all on function public.admin_transition_shop_order_atomic(
  text, bigint, uuid, text, text, text, text
) from public, anon, authenticated;
grant execute on function public.admin_transition_shop_order_atomic(
  text, bigint, uuid, text, text, text, text
) to service_role;

comment on table public.operations_transition_outbox is
  'PII-free durable owner-operation intents; trusted workers resolve recipients after commit.';
comment on function public.admin_transition_booking_atomic(text, bigint, uuid, text, text, text) is
  'CAS booking lifecycle transition with reservation release, audit and durable notification intent.';
comment on function public.admin_transition_shop_order_atomic(text, bigint, uuid, text, text, text, text) is
  'CAS shop order transition/details update. Payment status remains trusted-ledger-owned.';
