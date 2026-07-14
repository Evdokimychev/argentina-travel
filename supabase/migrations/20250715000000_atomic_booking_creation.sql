-- Server-owned booking creation: idempotency and inventory reservation share one transaction.

create or replace function public.create_booking_with_reservation(
  p_booking jsonb,
  p_slot_date date default null,
  p_guests integer default 1
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text := nullif(p_booking->>'id', '');
  v_existing public.bookings%rowtype;
  v_inserted public.bookings%rowtype;
  v_slot public.tour_availability_slots%rowtype;
  v_fingerprint text := p_booking #>> '{payload,metadata,requestFingerprint}';
begin
  if v_id is null or p_guests < 1 then
    raise exception 'INVALID_BOOKING_COMMAND';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_id, 0));

  select * into v_existing from public.bookings where id = v_id;
  if found then
    if coalesce(v_existing.payload #>> '{metadata,requestFingerprint}', '')
       <> coalesce(v_fingerprint, '') then
      raise exception 'IDEMPOTENCY_KEY_REUSED';
    end if;
    return jsonb_build_object('booking', to_jsonb(v_existing), 'created', false);
  end if;

  if p_slot_date is not null then
    select * into v_slot
      from public.tour_availability_slots
      where tour_id = p_booking->>'tour_id' and date = p_slot_date
      for update;

    if found then
      if v_slot.status <> 'open' then
        raise exception 'BOOKING_SLOT_CLOSED';
      end if;
      if v_slot.capacity - v_slot.booked_count < p_guests then
        raise exception 'BOOKING_SLOT_CAPACITY';
      end if;

      update public.tour_availability_slots
      set booked_count = booked_count + p_guests,
          status = case
            when booked_count + p_guests >= capacity then 'sold_out'
            else 'open'
          end
      where id = v_slot.id;
    end if;
  end if;

  insert into public.bookings (
    id, user_id, guest_user_id, organizer_user_id,
    tour_id, tour_slug, tour_title, tour_image,
    status, guests, total_price_usd,
    contact_name, contact_email, contact_phone,
    start_date, end_date, payment_status, payload,
    created_at, updated_at
  ) values (
    v_id,
    nullif(p_booking->>'user_id', '')::uuid,
    nullif(p_booking->>'guest_user_id', ''),
    nullif(p_booking->>'organizer_user_id', ''),
    p_booking->>'tour_id',
    p_booking->>'tour_slug',
    p_booking->>'tour_title',
    coalesce(p_booking->>'tour_image', ''),
    'new',
    p_guests,
    coalesce((p_booking->>'total_price_usd')::numeric, 0),
    coalesce(p_booking->>'contact_name', ''),
    lower(p_booking->>'contact_email'),
    coalesce(p_booking->>'contact_phone', ''),
    nullif(p_booking->>'start_date', '')::date,
    nullif(p_booking->>'end_date', '')::date,
    'pending',
    coalesce(p_booking->'payload', '{}'::jsonb),
    coalesce((p_booking->>'created_at')::timestamptz, now()),
    coalesce((p_booking->>'updated_at')::timestamptz, now())
  )
  returning * into v_inserted;

  return jsonb_build_object('booking', to_jsonb(v_inserted), 'created', true);
end;
$$;

revoke all on function public.create_booking_with_reservation(jsonb, date, integer) from public;
revoke all on function public.create_booking_with_reservation(jsonb, date, integer) from anon;
revoke all on function public.create_booking_with_reservation(jsonb, date, integer) from authenticated;
grant execute on function public.create_booking_with_reservation(jsonb, date, integer) to service_role;

comment on function public.create_booking_with_reservation(jsonb, date, integer) is
  'Atomically inserts a server-calculated booking and reserves an availability slot.';
