\set ON_ERROR_STOP on

begin;

do $$
declare
  owner_id constant uuid := '49000000-0000-4000-8000-000000000001';
  admin_id constant uuid := '49000000-0000-4000-8000-000000000002';
  first_result jsonb;
  second_result jsonb;
  first_version integer;
  second_version integer;
begin
  insert into auth.users(id, email, raw_user_meta_data)
  values
    (owner_id, 'tour-owner@example.invalid', '{}'::jsonb),
    (admin_id, 'tour-admin@example.invalid', '{}'::jsonb);
  insert into public.admin_staff(user_id, preset, capabilities, is_active)
  values (admin_id, 'super_admin', array['marketplace.moderation']::text[], true);
  update public.profiles
  set roles = array['admin']::text[], active_role = 'admin'
  where id = admin_id;
  insert into public.organizer_applications(user_id, company_name, status, reviewed_at)
  values (owner_id, 'Tour workflow smoke', 'approved', now());
  update public.profiles
  set roles = array['tourist', 'organizer']::text[], active_role = 'organizer'
  where id = owner_id;

  if has_function_privilege(
    'anon',
    'public.organizer_mutate_tour_atomic(text,uuid,integer,text,text,text,text,text,jsonb,jsonb,jsonb,text)',
    'EXECUTE'
  ) then
    raise exception 'anon unexpectedly has tour mutation execute privilege';
  end if;

  first_result := public.organizer_mutate_tour_atomic(
    'tour-atomic-first', owner_id, 0, 'save', 'ar', 'tour',
    'tour-atomic-first', 'Первый атомарный тур',
    '{"slug":"tour-atomic-first","title":"Первый атомарный тур"}'::jsonb,
    '{"id":"tour-atomic-first","slug":"tour-atomic-first","title":"Первый атомарный тур"}'::jsonb,
    '{"id":"tour-atomic-first","title":"Первый атомарный тур","status":"draft"}'::jsonb,
    '127.0.0.1'
  );
  first_version := (first_result->>'rowVersion')::integer;
  if first_version <> 1 then
    raise exception 'new draft version should be 1, got %', first_version;
  end if;

  first_result := public.organizer_mutate_tour_atomic(
    'tour-atomic-first', owner_id, first_version, 'submit', 'ar', 'tour',
    'tour-atomic-first', 'Первый атомарный тур',
    '{"slug":"tour-atomic-first","title":"Первый атомарный тур"}'::jsonb,
    '{"id":"tour-atomic-first","slug":"tour-atomic-first","title":"Первый атомарный тур"}'::jsonb,
    '{"id":"tour-atomic-first","title":"Первый атомарный тур","status":"published"}'::jsonb,
    null
  );
  first_version := (first_result->>'rowVersion')::integer;
  if first_result->>'moderationStatus' <> 'pending' then
    raise exception 'submit did not enter pending moderation';
  end if;
  if not exists (
    select 1 from public.moderation_queue
    where entity_type = 'tour' and entity_id = 'tour-atomic-first' and status = 'pending'
  ) then
    raise exception 'submit and moderation queue were not committed together';
  end if;

  begin
    perform public.organizer_mutate_tour_atomic(
      'tour-atomic-first', owner_id, first_version - 1, 'save', 'ar', 'tour',
      'tour-atomic-first', 'Устаревшая версия', '{}'::jsonb,
      '{"id":"tour-atomic-first","slug":"tour-atomic-first","title":"Устаревшая версия"}'::jsonb,
      '{"id":"tour-atomic-first","title":"Устаревшая версия"}'::jsonb, null
    );
    raise exception 'stale organizer mutation unexpectedly succeeded';
  exception when serialization_failure then
    null;
  end;

  insert into public.organizer_entitlement_overrides(
    organizer_user_id, entitlement_key, enabled, limit_value, reason
  ) values (owner_id, 'limits.active_offers', true, 1, 'Smoke limit');

  begin
    insert into public.apartment_listings(
      market_id, country_code, slug, owner_user_id, created_by_user_id,
      source_owner_type, property_timezone, title, summary, description,
      locality, region, max_guests, beds, bathrooms, nightly_price_minor,
      currency, status
    ) values (
      'ar', 'AR', 'tour-limit-apartment', owner_id, owner_id,
      'organizer', 'America/Argentina/Buenos_Aires', 'Апартаменты для лимита',
      'Проверка общего лимита.', 'Проверка общего лимита активных предложений.',
      'Buenos Aires', 'CABA', 2, 1, 1, 10000, 'USD', 'published'
    );
    raise exception 'apartment publication bypassed the shared offer limit';
  exception when raise_exception then
    if sqlerrm <> 'ACTIVE_OFFER_LIMIT_REACHED' then raise; end if;
  end;

  second_result := public.organizer_mutate_tour_atomic(
    'tour-atomic-second', owner_id, 0, 'save', 'ar', 'excursion',
    'tour-atomic-second', 'Вторая атомарная экскурсия',
    '{"slug":"tour-atomic-second","title":"Вторая атомарная экскурсия"}'::jsonb,
    '{"id":"tour-atomic-second","slug":"tour-atomic-second","title":"Вторая атомарная экскурсия"}'::jsonb,
    '{"id":"tour-atomic-second","title":"Вторая атомарная экскурсия","status":"draft"}'::jsonb,
    null
  );
  second_version := (second_result->>'rowVersion')::integer;

  begin
    perform public.organizer_mutate_tour_atomic(
      'tour-atomic-second', owner_id, second_version, 'submit', 'ar', 'excursion',
      'tour-atomic-second', 'Вторая атомарная экскурсия', '{}'::jsonb,
      '{"id":"tour-atomic-second","slug":"tour-atomic-second","title":"Вторая атомарная экскурсия"}'::jsonb,
      '{"id":"tour-atomic-second","title":"Вторая атомарная экскурсия","status":"published"}'::jsonb,
      null
    );
    raise exception 'shared active-offer limit was bypassed';
  exception when raise_exception then
    if sqlerrm <> 'TOUR_ACTIVE_OFFER_LIMIT_REACHED' then raise; end if;
  end;

  first_result := public.organizer_mutate_tour_atomic(
    'tour-atomic-first', owner_id, first_version, 'archive', 'ar', 'tour',
    'tour-atomic-first', 'Первый атомарный тур', '{}'::jsonb,
    '{"id":"tour-atomic-first","slug":"tour-atomic-first","title":"Первый атомарный тур"}'::jsonb,
    '{"id":"tour-atomic-first","title":"Первый атомарный тур","archived":true}'::jsonb,
    null
  );
  if first_result->>'status' <> 'archived' or exists (
    select 1 from public.moderation_queue
    where entity_type = 'tour' and entity_id = 'tour-atomic-first'
      and status in ('pending', 'in_review')
  ) then
    raise exception 'archive did not atomically close the public workflow';
  end if;

  second_result := public.organizer_mutate_tour_atomic(
    'tour-atomic-second', owner_id, second_version, 'submit', 'ar', 'excursion',
    'tour-atomic-second', 'Вторая атомарная экскурсия', '{}'::jsonb,
    '{"id":"tour-atomic-second","slug":"tour-atomic-second","title":"Вторая атомарная экскурсия"}'::jsonb,
    '{"id":"tour-atomic-second","title":"Вторая атомарная экскурсия","status":"published"}'::jsonb,
    null
  );

  begin
    perform public.organizer_mutate_tour_atomic(
      'tour-atomic-second', owner_id, (second_result->>'rowVersion')::integer,
      'submit', 'uy', 'excursion', 'tour-atomic-second', 'Другой рынок', '{}'::jsonb,
      '{"id":"tour-atomic-second","slug":"tour-atomic-second","title":"Другой рынок"}'::jsonb,
      '{"id":"tour-atomic-second","title":"Другой рынок","status":"published"}'::jsonb,
      null
    );
    raise exception 'publication without a market capability unexpectedly succeeded';
  exception when insufficient_privilege then
    if sqlerrm <> 'TOUR_MARKET_NOT_ENTITLED' then raise; end if;
  end;

  perform public.admin_unpublish_tour_atomic(
    'tour-atomic-second', (second_result->>'rowVersion')::integer,
    admin_id, 'unpublish', '127.0.0.1'
  );
  if not exists (
    select 1 from public.tours
    where id = 'tour-atomic-second' and status = 'draft'
      and row_version = (second_result->>'rowVersion')::integer + 1
  ) then
    raise exception 'admin CAS unpublish did not persist';
  end if;
  if not exists (
    select 1 from public.admin_audit_log
    where actor_user_id = admin_id and action = 'tour.unpublish'
      and entity_id = 'tour-atomic-second'
  ) then
    raise exception 'admin unpublish audit is missing';
  end if;

  if (select count(*) from public.admin_audit_log
      where actor_user_id = owner_id and action like 'organizer.tour_%') <> 5 then
    raise exception 'expected five committed organizer audit events';
  end if;
end;
$$;

rollback;
