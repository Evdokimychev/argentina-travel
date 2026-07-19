\set ON_ERROR_STOP on

begin;

do $$
declare
  admin_id constant uuid := '41000000-0000-4000-8000-000000000001';
  owner_id constant uuid := '41000000-0000-4000-8000-000000000002';
  provider_id uuid;
  vehicle_id uuid;
  offer_id uuid;
  first_request jsonb;
  replayed_request jsonb;
  second_request jsonb;
  next_request jsonb;
  notification_count integer;
begin
  insert into auth.users(id, email, raw_user_meta_data)
  values
    (admin_id, 'mobility-admin@example.invalid', '{}'::jsonb),
    (owner_id, 'mobility-owner@example.invalid', '{}'::jsonb);
  insert into public.admin_staff(user_id, preset, capabilities, is_active)
  values (admin_id, 'super_admin', array['*']::text[], true);
  update public.profiles set roles = array['admin']::text[], active_role = 'admin' where id = admin_id;

  insert into public.mobility_providers(
    provider_key, owner_user_id, display_name, provider_kind, source_ownership,
    capability_mode, verification_status, health_status
  ) values (
    'organizer:smoke-uy', owner_id, 'Перевозчик smoke UY', 'organizer_native', 'organizer',
    'native_request', 'verified', 'healthy'
  ) returning id into provider_id;
  insert into public.mobility_provider_markets(
    provider_id, vertical, market_id, country_code, timezone, source_currency,
    display_currency, capability_mode, readiness_status, health_status, public_enabled
  ) values (
    provider_id, 'rental', 'uy', 'UY', 'America/Montevideo', 'UYU', 'UYU',
    'native_request', 'verified', 'healthy', true
  );
  insert into public.mobility_vehicles(
    provider_id, owner_user_id, market_id, country_code, timezone, public_name,
    vehicle_class, seat_capacity, luggage_capacity, verification_status,
    documents_valid_until, status
  ) values (
    provider_id, owner_id, 'uy', 'UY', 'America/Montevideo', 'Комфортный седан',
    'comfort', 4, 2, 'verified', current_date + 365, 'published'
  ) returning id into vehicle_id;
  insert into public.mobility_rental_offers(
    provider_id, vehicle_id, owner_user_id, market_id, country_code,
    pickup_timezone, dropoff_timezone, slug, title, pickup_public_label,
    dropoff_public_label, source_currency, display_currency, daily_rate_minor,
    deposit_minor, mileage_policy, fuel_policy, insurance_summary,
    additional_driver_policy, capability_mode, status
  ) values (
    provider_id, vehicle_id, owner_id, 'uy', 'UY',
    'America/Montevideo', 'America/Montevideo', 'smoke-car-uy', 'Авто для smoke-проверки',
    'Центр Монтевидео', 'Центр Монтевидео', 'UYU', 'UYU', 250000,
    100000, 'unlimited', 'full_to_full', 'Базовая страховка включена',
    'on_request', 'native_request', 'published'
  ) returning id into offer_id;

  first_request := public.mobility_create_request(
    provider_id, 'rental', offer_id, 'mobility-smoke-key-0001', null,
    'Smoke Guest', 'guest-one@example.invalid', '+598000000',
    '{"pickup":"2027-03-10T10:00:00-03:00"}'::jsonb, 'Детское кресло',
    '41000000-0000-4000-8000-000000000010', 'smoke'
  );
  replayed_request := public.mobility_create_request(
    provider_id, 'rental', offer_id, 'mobility-smoke-key-0001', null,
    'Smoke Guest', 'guest-one@example.invalid', '+598000000',
    '{"pickup":"2027-03-10T10:00:00-03:00"}'::jsonb, 'Детское кресло',
    '41000000-0000-4000-8000-000000000010', 'smoke'
  );
  if first_request->>'id' <> replayed_request->>'id' then
    raise exception 'idempotent replay created another request';
  end if;
  begin
    perform public.mobility_create_request(
      provider_id, 'rental', offer_id, 'mobility-smoke-key-0001', null,
      'Another Guest', 'different@example.invalid', null, '{}'::jsonb, null,
      '41000000-0000-4000-8000-000000000011', 'smoke'
    );
    raise exception 'fingerprint conflict unexpectedly succeeded';
  exception when unique_violation then null;
  end;

  select count(*) into notification_count from public.admin_notifications
  where metadata @> jsonb_build_object(
    'entity_type', 'mobility_request',
    'entity_id', (first_request->>'id')::uuid
  );
  if notification_count <> 1 then raise exception 'expected one request notification, got %', notification_count; end if;

  next_request := public.mobility_transition_request(
    owner_id, 'organizer', (first_request->>'id')::uuid, 1, 'in_review',
    null, null, null, '41000000-0000-4000-8000-000000000020'
  );
  begin
    perform public.mobility_transition_request(
      owner_id, 'organizer', (first_request->>'id')::uuid, 1, 'rejected',
      null, null, null, '41000000-0000-4000-8000-000000000021'
    );
    raise exception 'stale transition unexpectedly succeeded';
  exception when serialization_failure then null;
  end;
  next_request := public.mobility_transition_request(
    owner_id, 'organizer', (first_request->>'id')::uuid, (next_request->>'rowVersion')::bigint,
    'confirmed', vehicle_id, '2027-03-10T10:00:00-03:00', '2027-03-12T10:00:00-03:00',
    '41000000-0000-4000-8000-000000000022'
  );

  second_request := public.mobility_create_request(
    provider_id, 'rental', offer_id, 'mobility-smoke-key-0002', null,
    'Second Guest', 'guest-two@example.invalid', null, '{}'::jsonb, null,
    '41000000-0000-4000-8000-000000000030', 'smoke'
  );
  second_request := public.mobility_transition_request(
    admin_id, 'admin', (second_request->>'id')::uuid, 1, 'in_review',
    null, null, null, '41000000-0000-4000-8000-000000000031'
  );
  begin
    perform public.mobility_transition_request(
      admin_id, 'admin', (second_request->>'id')::uuid, (second_request->>'rowVersion')::bigint,
      'confirmed', vehicle_id, '2027-03-11T10:00:00-03:00', '2027-03-13T10:00:00-03:00',
      '41000000-0000-4000-8000-000000000032'
    );
    raise exception 'overlapping allocation unexpectedly succeeded';
  exception when check_violation then null;
  end;

  next_request := public.mobility_transition_request(
    admin_id, 'admin', (first_request->>'id')::uuid, (next_request->>'rowVersion')::bigint,
    'cancelled', null, null, null, '41000000-0000-4000-8000-000000000040'
  );
  perform public.mobility_transition_request(
    admin_id, 'admin', (second_request->>'id')::uuid, (second_request->>'rowVersion')::bigint,
    'confirmed', vehicle_id, '2027-03-11T10:00:00-03:00', '2027-03-13T10:00:00-03:00',
    '41000000-0000-4000-8000-000000000041'
  );

  if not exists (
    select 1 from public.mobility_requests
    where id = (second_request->>'id')::uuid and status = 'confirmed'
  ) then raise exception 'second request was not confirmed after allocation release'; end if;
end;
$$;

rollback;
