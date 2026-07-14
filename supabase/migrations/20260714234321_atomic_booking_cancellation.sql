-- Cancel a booking and release its reserved seats in the same transaction.

create or replace function public.cancel_booking_with_reservation_release(
  p_booking_id text,
  p_expected_updated_at timestamptz,
  p_payload jsonb,
  p_updated_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
  v_updated public.bookings%rowtype;
begin
  select * into v_booking
    from public.bookings
    where id = p_booking_id
    for update;

  if not found then
    raise exception 'BOOKING_NOT_FOUND';
  end if;

  if p_expected_updated_at is not null and v_booking.updated_at <> p_expected_updated_at then
    raise exception 'BOOKING_CONFLICT';
  end if;

  if v_booking.status = 'cancelled' then
    return to_jsonb(v_booking);
  end if;

  if v_booking.status not in ('new', 'pending', 'confirmed', 'waiting_payment', 'paid') then
    raise exception 'BOOKING_CANNOT_BE_CANCELLED';
  end if;

  if v_booking.start_date is not null then
    update public.tour_availability_slots
    set booked_count = greatest(0, booked_count - greatest(1, v_booking.guests)),
        status = case
          when status = 'closed' then 'closed'
          when greatest(0, booked_count - greatest(1, v_booking.guests)) >= capacity then 'sold_out'
          else 'open'
        end
    where tour_id = v_booking.tour_id
      and date = v_booking.start_date;
  end if;

  update public.bookings
  set status = 'cancelled',
      payload = coalesce(p_payload, v_booking.payload),
      updated_at = coalesce(p_updated_at, now())
  where id = p_booking_id
  returning * into v_updated;

  return to_jsonb(v_updated);
end;
$$;

revoke all on function public.cancel_booking_with_reservation_release(text, timestamptz, jsonb, timestamptz) from public;
revoke all on function public.cancel_booking_with_reservation_release(text, timestamptz, jsonb, timestamptz) from anon;
revoke all on function public.cancel_booking_with_reservation_release(text, timestamptz, jsonb, timestamptz) from authenticated;
grant execute on function public.cancel_booking_with_reservation_release(text, timestamptz, jsonb, timestamptz) to service_role;

comment on function public.cancel_booking_with_reservation_release(text, timestamptz, jsonb, timestamptz) is
  'Atomically cancels a booking and releases its reserved availability seats.';
