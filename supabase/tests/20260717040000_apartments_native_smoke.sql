\set ON_ERROR_STOP on

begin;

do $$
declare
  admin_id constant uuid := '40000000-0000-4000-8000-000000000001';
  owner_id constant uuid := '40000000-0000-4000-8000-000000000002';
  listing public.apartment_listings%rowtype;
  first_inquiry public.apartment_inquiries%rowtype;
  repeated_inquiry public.apartment_inquiries%rowtype;
  notification_count integer;
  audit_count integer;
  input jsonb := jsonb_build_object(
    'marketId', 'uy',
    'countryCode', 'UY',
    'slug', 'montevideo-smoke-apartment',
    'propertyTimezone', 'America/Montevideo',
    'title', 'Апартаменты для smoke-проверки',
    'summary', 'Проверяемое предложение в независимом рынке Уругвая.',
    'description', repeat('Проверенное описание апартаментов, условий проживания и района. ', 3),
    'locality', 'Montevideo',
    'region', 'Montevideo',
    'publicLocationNote', 'Центральный район без точного адреса',
    'publicLatitude', -34.90,
    'publicLongitude', -56.16,
    'exactAddress', 'Private test address 10',
    'accessInstructions', 'Только после подтверждения',
    'maxGuests', 3,
    'bedrooms', 1,
    'beds', 2,
    'bathrooms', 1,
    'amenities', jsonb_build_array('Wi-Fi', 'Кухня'),
    'houseRules', jsonb_build_array('Не курить'),
    'nightlyPriceMinor', 12500,
    'currency', 'UYU',
    'minimumStayNights', 2,
    'depositMinor', 5000,
    'depositDisclosure', 'Возвращается после проверки объекта',
    'cancellationDisclosure', 'Бесплатная отмена до согласованного срока'
  );
  images jsonb := jsonb_build_array(jsonb_build_object(
    'media_ref', '/media/apartments/smoke.jpg',
    'alt_text', 'Гостиная тестовых апартаментов',
    'rights_holder', 'Test rights holder',
    'rights_source_url', '',
    'license_code', 'owned',
    'position', 0
  ));
begin
  insert into auth.users(id, email, raw_user_meta_data)
  values
    (admin_id, 'apartment-admin@example.invalid', '{}'::jsonb),
    (owner_id, 'apartment-owner@example.invalid', '{}'::jsonb);
  insert into public.admin_staff(user_id, preset, capabilities, is_active)
  values (admin_id, 'super_admin', array['*']::text[], true);
  update public.profiles
  set roles = array['admin']::text[], active_role = 'admin'
  where id = admin_id;

  select * into listing
  from public.apartment_save_draft(null, null, admin_id, owner_id, true, input, images);
  if listing.market_id <> 'uy' or listing.country_code <> 'UY' then
    raise exception 'multi-market snapshot was not preserved';
  end if;
  if not exists (
    select 1 from public.apartment_private_locations
    where apartment_id = listing.id and exact_address = 'Private test address 10'
  ) then
    raise exception 'private address was not stored separately';
  end if;

  select * into listing
  from public.apartment_submit_for_review(listing.id, listing.row_version, owner_id);
  select * into listing
  from public.apartment_moderate(listing.id, listing.row_version, admin_id, 'publish', null);

  perform public.apartment_replace_availability(
    listing.id,
    listing.row_version,
    owner_id,
    jsonb_build_array(jsonb_build_object(
      'start_date', '2027-01-10',
      'end_date', '2027-01-12',
      'note', 'Закрыто владельцем'
    ))
  );
  select * into listing from public.apartment_listings where id = listing.id;

  begin
    perform public.apartment_replace_availability(
      listing.id, listing.row_version - 1, owner_id, '[]'::jsonb
    );
    raise exception 'stale calendar update unexpectedly succeeded';
  exception when serialization_failure then
    null;
  end;

  begin
    perform public.apartment_replace_availability(
      listing.id, listing.row_version, admin_id, '[]'::jsonb
    );
    raise exception 'non-owner calendar update unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;

  select * into first_inquiry
  from public.apartment_create_inquiry(
    listing.id, '2027-02-01'::date, '2027-02-04'::date, 2::smallint, 'Smoke Guest',
    'apartment-guest@example.invalid', '', '', repeat('a', 64), repeat('b', 64)
  );
  select * into repeated_inquiry
  from public.apartment_create_inquiry(
    listing.id, '2027-02-01'::date, '2027-02-04'::date, 2::smallint, 'Smoke Guest',
    'apartment-guest@example.invalid', '', '', repeat('a', 64), repeat('b', 64)
  );
  if first_inquiry.id <> repeated_inquiry.id then
    raise exception 'idempotent replay created a second inquiry';
  end if;
  if first_inquiry.price_currency_snapshot <> 'UYU'
    or first_inquiry.nightly_price_minor_snapshot <> 12500
  then
    raise exception 'price snapshot was not preserved';
  end if;

  select count(*) into notification_count
  from public.admin_notifications
  where metadata @> jsonb_build_object(
    'entity_type', 'apartment_inquiry',
    'entity_id', first_inquiry.id
  );
  if notification_count <> 1 then
    raise exception 'expected one atomic notification, got %', notification_count;
  end if;

  select count(*) into audit_count
  from public.admin_audit_log
  where entity_id = listing.id::text
    and action in ('apartment.created', 'apartment.submitted', 'apartment.publish', 'apartment.availability_replaced');
  if audit_count <> 4 then
    raise exception 'expected four lifecycle audit rows, got %', audit_count;
  end if;
end;
$$;

rollback;
