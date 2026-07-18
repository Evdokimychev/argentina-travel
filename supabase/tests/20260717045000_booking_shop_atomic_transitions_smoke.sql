\set ON_ERROR_STOP on

begin;

do $$
declare
  actor_id constant uuid := '45000000-0000-4000-8000-000000000001';
  booking_row public.bookings%rowtype;
  shop_order_row public.shop_orders%rowtype;
  category_id uuid := gen_random_uuid();
  audit_count integer;
  outbox_count integer;
begin
  insert into auth.users(id, email, raw_user_meta_data)
  values (actor_id, 'atomic-operations-owner@example.invalid', '{}'::jsonb);
  insert into public.admin_staff(user_id, preset, capabilities, is_active)
  values (actor_id, 'super_admin', array['*']::text[], true);
  update public.profiles
  set roles = array['admin']::text[], active_role = 'admin', is_blocked = false
  where id = actor_id;

  insert into public.tours(id, slug, owner_user_id, status, title, payload)
  values (
    'tour-atomic-operations', 'tour-atomic-operations', actor_id::text,
    'draft', 'Atomic operations tour', '{}'::jsonb
  );
  insert into public.tour_availability_slots(tour_id, date, capacity, booked_count, status)
  values ('tour-atomic-operations', '2027-05-10', 5, 2, 'open');
  insert into public.bookings(
    id, organizer_user_id, tour_id, tour_slug, tour_title, guests,
    contact_name, contact_email, start_date, payment_status, payload
  ) values (
    'booking-atomic-operations', actor_id::text, 'tour-atomic-operations',
    'tour-atomic-operations', 'Atomic operations tour', 2,
    'Smoke guest', 'booking-atomic@example.invalid', '2027-05-10', 'pending',
    '{"statusHistory":[]}'::jsonb
  );

  select * into booking_row from public.admin_transition_booking_atomic(
    'booking-atomic-operations', 1, actor_id, 'pending', 'Взято в работу', '127.0.0.1'
  );
  if booking_row.status <> 'pending' or booking_row.operation_version <> 2 then
    raise exception 'booking first CAS transition failed';
  end if;

  begin
    perform public.admin_transition_booking_atomic(
      'booking-atomic-operations', 1, actor_id, 'confirmed', null, null
    );
    raise exception 'stale booking CAS unexpectedly succeeded';
  exception when serialization_failure then
    null;
  end;

  select * into booking_row from public.admin_transition_booking_atomic(
    'booking-atomic-operations', 2, actor_id, 'cancelled', null, null
  );
  if booking_row.status <> 'cancelled' or booking_row.operation_version <> 3 then
    raise exception 'booking cancellation failed';
  end if;
  if (select booked_count from public.tour_availability_slots
      where tour_id = 'tour-atomic-operations' and date = '2027-05-10') <> 0 then
    raise exception 'booking cancellation did not release reserved seats';
  end if;

  insert into public.bookings(
    id, organizer_user_id, tour_id, tour_slug, tour_title, status, guests,
    contact_name, contact_email, payment_status, payload
  ) values (
    'booking-paid-operations', actor_id::text, 'tour-atomic-operations',
    'tour-atomic-operations', 'Paid operations tour', 'waiting_payment', 1,
    'Paid guest', 'booking-paid@example.invalid', 'paid', '{"statusHistory":[]}'::jsonb
  );
  select * into booking_row from public.admin_transition_booking_atomic(
    'booking-paid-operations', 1, actor_id, 'completed', null, null
  );
  if booking_row.status <> 'completed' or booking_row.payment_status <> 'paid' then
    raise exception 'paid booking was masked or not completed';
  end if;

  insert into public.shop_product_categories(id, slug, name)
  values (category_id, 'atomic-operations', 'Atomic operations');
  insert into public.shop_products(
    id, category_id, slug, title, description, delivery_type,
    price_minor, currency, availability, status
  ) values (
    'shop-atomic-operations', category_id, 'atomic-operations-product',
    'Atomic operations product', 'Smoke product for atomic operations.', 'digital',
    1900, 'USD', 'unlimited', 'draft'
  );
  insert into public.shop_orders(
    id, product_id, product_slug, product_title, price_usd, currency,
    customer_name, customer_email
  ) values (
    'shop-order-atomic-operations', 'shop-atomic-operations',
    'atomic-operations-product', 'Atomic operations product', 19, 'USD',
    'Smoke customer', 'shop-atomic@example.invalid'
  );

  begin
    perform public.admin_transition_shop_order_atomic(
      'shop-order-atomic-operations', 1, actor_id, 'paid', null, null, null
    );
    raise exception 'admin marked an unpaid order paid';
  exception when insufficient_privilege then
    null;
  end;

  select * into shop_order_row from public.admin_transition_shop_order_atomic(
    'shop-order-atomic-operations', 1, actor_id, 'awaiting_payment', null, null, null
  );
  if shop_order_row.status <> 'awaiting_payment' or shop_order_row.operation_version <> 2 then
    raise exception 'shop awaiting-payment transition failed';
  end if;

  -- Simulates a trusted ledger/webhook write. The payment trigger invalidates stale admin screens.
  update public.shop_orders set payment_status = 'paid'
  where id = 'shop-order-atomic-operations';
  select * into shop_order_row from public.shop_orders
  where id = 'shop-order-atomic-operations';
  if shop_order_row.operation_version <> 3 then
    raise exception 'trusted payment change did not bump CAS version';
  end if;

  begin
    perform public.admin_transition_shop_order_atomic(
      'shop-order-atomic-operations', 3, actor_id, 'cancelled', null, null, null
    );
    raise exception 'paid shop order was cancelled before refund';
  exception when insufficient_privilege then
    null;
  end;

  select * into shop_order_row from public.admin_transition_shop_order_atomic(
    'shop-order-atomic-operations', 3, actor_id, 'paid', null, null, null
  );
  select * into shop_order_row from public.admin_transition_shop_order_atomic(
    'shop-order-atomic-operations', 4, actor_id, 'delivered',
    'https://downloads.example.invalid/order', 'Передано клиенту', null
  );
  if shop_order_row.status <> 'delivered' or shop_order_row.payment_status <> 'paid'
     or shop_order_row.operation_version <> 5 then
    raise exception 'shop paid-to-delivered lifecycle failed';
  end if;

  select count(*) into audit_count
  from public.admin_audit_log
  where actor_user_id = actor_id
    and action in ('booking.status_changed', 'shop_order.status_changed');
  if audit_count <> 6 then
    raise exception 'expected six atomic lifecycle audit rows, got %', audit_count;
  end if;

  select count(*) into outbox_count
  from public.operations_transition_outbox
  where entity_id in (
    'booking-atomic-operations', 'booking-paid-operations', 'shop-order-atomic-operations'
  );
  if outbox_count <> 9 then
    raise exception 'expected nine durable intents, got %', outbox_count;
  end if;
  if exists (
    select 1 from public.operations_transition_outbox
    where payload ?| array['contactEmail', 'customerEmail', 'deliveryUrl', 'notes']
  ) then
    raise exception 'PII leaked into transition outbox';
  end if;
end;
$$;

rollback;
