\set ON_ERROR_STOP on

begin;

do $$
declare
  admin_id constant uuid := '44000000-0000-4000-8000-000000000001';
  owner_id constant uuid := '44000000-0000-4000-8000-000000000002';
  other_owner_id constant uuid := '44000000-0000-4000-8000-000000000003';
  listing public.apartment_listings%rowtype;
  first_inquiry public.apartment_inquiries%rowtype;
  second_inquiry public.apartment_inquiries%rowtype;
  block_id uuid;
  manual_block_id uuid;
  communication_count integer;
  audit_count integer;
  input jsonb := jsonb_build_object(
    'marketId', 'ar', 'countryCode', 'AR', 'slug', 'operations-smoke-apartment',
    'propertyTimezone', 'America/Argentina/Buenos_Aires',
    'title', 'Апартаменты для проверки заявок',
    'summary', 'Проверяем последовательную обработку заявок гостей.',
    'description', repeat('Проверенное описание апартаментов и условий проживания. ', 3),
    'locality', 'Buenos Aires', 'region', 'CABA',
    'publicLocationNote', 'Район без точного адреса',
    'exactAddress', 'Private operations address 44', 'accessInstructions', '',
    'maxGuests', 4, 'bedrooms', 1, 'beds', 2, 'bathrooms', 1,
    'amenities', jsonb_build_array('Wi-Fi'), 'houseRules', jsonb_build_array('Не курить'),
    'nightlyPriceMinor', 15000, 'currency', 'USD', 'minimumStayNights', 2,
    'depositMinor', null, 'depositDisclosure', '',
    'cancellationDisclosure', 'Отмена по согласованным условиям'
  );
  images jsonb := jsonb_build_array(jsonb_build_object(
    'media_ref', '/media/apartments/operations-smoke.jpg',
    'alt_text', 'Гостиная апартаментов', 'rights_holder', 'Test owner',
    'rights_source_url', '', 'license_code', 'owned', 'position', 0
  ));
begin
  insert into auth.users(id, email, raw_user_meta_data)
  values
    (admin_id, 'apartment-ops-admin@example.invalid', '{}'::jsonb),
    (owner_id, 'apartment-ops-owner@example.invalid', '{}'::jsonb),
    (other_owner_id, 'apartment-ops-other@example.invalid', '{}'::jsonb);
  insert into public.admin_staff(user_id, preset, capabilities, is_active)
  values (admin_id, 'marketplace_manager', array['marketplace.moderation']::text[], true);
  update public.profiles set roles = array['admin']::text[], active_role = 'admin' where id = admin_id;

  select * into listing
  from public.apartment_save_draft(null, null, admin_id, owner_id, true, input, images);
  select * into listing
  from public.apartment_submit_for_review(listing.id, listing.row_version, owner_id);
  select * into listing
  from public.apartment_moderate(listing.id, listing.row_version, admin_id, 'publish', null);

  insert into public.apartment_availability_blocks(
    apartment_id, stay_range, status, source, note, created_by_user_id
  ) values (
    listing.id, daterange('2027-05-01', '2027-05-03', '[)'), 'blocked', 'manual',
    'Ручная блокировка', owner_id
  ) returning id into manual_block_id;

  select * into first_inquiry from public.apartment_create_inquiry(
    listing.id, '2027-06-10', '2027-06-14', 2::smallint,
    'Первый гость', 'first-apartment-guest@example.invalid', '+54000000001', 'Первый запрос',
    repeat('1', 64), repeat('a', 64)
  );
  select * into second_inquiry from public.apartment_create_inquiry(
    listing.id, '2027-06-10', '2027-06-14', 2::smallint,
    'Второй гость', 'second-apartment-guest@example.invalid', '+54000000002', 'Второй запрос',
    repeat('2', 64), repeat('b', 64)
  );

  begin
    perform public.apartment_transition_inquiry(
      first_inquiry.id, first_inquiry.row_version, other_owner_id, false, 'in_review', null
    );
    raise exception 'non-owner organizer changed inquiry';
  exception when insufficient_privilege then null;
  end;

  select * into first_inquiry from public.apartment_transition_inquiry(
    first_inquiry.id, first_inquiry.row_version, owner_id, false, 'in_review', 'Уточняем заселение'
  );
  select * into first_inquiry from public.apartment_transition_inquiry(
    first_inquiry.id, first_inquiry.row_version, owner_id, false, 'confirmed', 'Условия согласованы'
  );
  select confirmed_block_id into block_id from public.apartment_inquiries where id = first_inquiry.id;
  if block_id is null or not exists (
    select 1 from public.apartment_availability_blocks
    where id = block_id and inquiry_id = first_inquiry.id and status = 'confirmed'
  ) then
    raise exception 'confirmation did not create its availability block';
  end if;

  select * into second_inquiry from public.apartment_transition_inquiry(
    second_inquiry.id, second_inquiry.row_version, owner_id, false, 'in_review', null
  );
  begin
    perform public.apartment_transition_inquiry(
      second_inquiry.id, second_inquiry.row_version, owner_id, false, 'confirmed', null
    );
    raise exception 'overlapping inquiry was confirmed';
  exception when exclusion_violation then null;
  end;

  begin
    perform public.apartment_transition_inquiry(
      first_inquiry.id, first_inquiry.row_version - 1, admin_id, true, 'cancelled', null
    );
    raise exception 'stale inquiry mutation succeeded';
  exception when serialization_failure then null;
  end;

  select * into first_inquiry from public.apartment_transition_inquiry(
    first_inquiry.id, first_inquiry.row_version, admin_id, true, 'cancelled', 'Отменено после связи'
  );
  if exists (select 1 from public.apartment_availability_blocks where id = block_id and status <> 'cancelled') then
    raise exception 'linked confirmed block was not released';
  end if;
  if not exists (select 1 from public.apartment_availability_blocks where id = manual_block_id and status = 'blocked') then
    raise exception 'cancellation touched an unrelated manual block';
  end if;

  select * into second_inquiry from public.apartment_transition_inquiry(
    second_inquiry.id, second_inquiry.row_version, owner_id, false, 'confirmed', null
  );
  if second_inquiry.status <> 'confirmed' then
    raise exception 'dates were not reusable after linked cancellation';
  end if;

  select count(*) into communication_count
  from public.apartment_inquiry_communication_outbox
  where inquiry_id = first_inquiry.id;
  if communication_count <> 6 then
    raise exception 'expected six durable recipient intents, got %', communication_count;
  end if;
  if exists (
    select 1 from public.apartment_inquiry_communication_outbox
    where payload ?| array['guestEmail', 'guestPhone', 'guestName', 'provider', 'apiKey', 'token']
  ) then
    raise exception 'communication payload contains forbidden keys';
  end if;

  select count(*) into audit_count
  from public.admin_audit_log
  where entity_type = 'apartment_inquiry' and entity_id = first_inquiry.id::text;
  if audit_count <> 3 then
    raise exception 'expected three inquiry audit events, got %', audit_count;
  end if;
end;
$$;

rollback;
