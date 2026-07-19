-- Sprint M1: native apartment inventory and request-first booking.

create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;

create table public.apartment_listings (
  id uuid primary key default gen_random_uuid(),
  market_id text not null default 'ar' check (market_id ~ '^[a-z][a-z0-9_-]{1,31}$'),
  country_code text not null default 'AR' check (country_code ~ '^[A-Z]{2}$'),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  owner_user_id uuid not null references public.profiles(id) on delete restrict,
  created_by_user_id uuid not null references public.profiles(id) on delete restrict,
  source_owner_type text not null check (source_owner_type in ('admin', 'organizer')),
  provider_code text not null default 'own' check (provider_code = 'own'),
  booking_mode text not null default 'native_request' check (booking_mode = 'native_request'),
  availability_mode text not null default 'managed_calendar' check (availability_mode = 'managed_calendar'),
  property_timezone text not null default 'America/Argentina/Buenos_Aires' check (length(property_timezone) between 3 and 80),
  title text not null check (length(btrim(title)) between 3 and 160),
  summary text not null default '' check (length(summary) <= 500),
  description text not null default '' check (length(description) <= 12000),
  locality text not null check (length(btrim(locality)) between 2 and 120),
  region text not null check (length(btrim(region)) between 2 and 120),
  public_location_note text not null default '' check (length(public_location_note) <= 300),
  public_latitude numeric(8,5),
  public_longitude numeric(8,5),
  max_guests smallint not null check (max_guests between 1 and 40),
  bedrooms smallint not null default 0 check (bedrooms between 0 and 20),
  beds smallint not null default 1 check (beds between 1 and 40),
  bathrooms numeric(4,1) not null default 1 check (bathrooms between 0.5 and 20),
  amenities text[] not null default '{}',
  house_rules text[] not null default '{}',
  nightly_price_minor bigint not null check (nightly_price_minor > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  minimum_stay_nights smallint not null default 1 check (minimum_stay_nights between 1 and 365),
  deposit_minor bigint check (deposit_minor is null or deposit_minor >= 0),
  deposit_disclosure text not null default '' check (length(deposit_disclosure) <= 500),
  cancellation_disclosure text not null default '' check (length(cancellation_disclosure) <= 1000),
  status text not null default 'draft' check (status in ('draft', 'review', 'published', 'archived')),
  row_version integer not null default 1 check (row_version > 0),
  submitted_at timestamptz,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (market_id, slug),
  check ((public_latitude is null) = (public_longitude is null)),
  check (public_latitude is null or public_latitude between -90 and 90),
  check (public_longitude is null or public_longitude between -180 and 180),
  check (public_latitude is null or public_latitude = round(public_latitude, 2)),
  check (public_longitude is null or public_longitude = round(public_longitude, 2)),
  check (deposit_minor is null or length(btrim(deposit_disclosure)) > 0)
);

create table public.apartment_private_locations (
  apartment_id uuid primary key references public.apartment_listings(id) on delete cascade,
  exact_address text not null check (length(btrim(exact_address)) between 5 and 500),
  access_instructions text not null default '' check (length(access_instructions) <= 2000),
  updated_by_user_id uuid not null references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now()
);

create table public.apartment_images (
  id uuid primary key default gen_random_uuid(),
  apartment_id uuid not null references public.apartment_listings(id) on delete cascade,
  media_ref text not null check (length(btrim(media_ref)) between 3 and 1000),
  alt_text text not null check (length(btrim(alt_text)) between 3 and 240),
  rights_holder text not null check (length(btrim(rights_holder)) between 2 and 240),
  rights_source_url text,
  license_code text not null check (length(btrim(license_code)) between 2 and 80),
  position smallint not null default 0 check (position between 0 and 1000),
  created_at timestamptz not null default now(),
  unique (apartment_id, position),
  check (rights_source_url is null or rights_source_url ~ '^https://')
);

create table public.apartment_availability_blocks (
  id uuid primary key default gen_random_uuid(),
  apartment_id uuid not null references public.apartment_listings(id) on delete cascade,
  stay_range daterange not null,
  status text not null check (status in ('blocked', 'confirmed', 'cancelled')),
  source text not null default 'manual' check (source in ('manual', 'confirmed_inquiry')),
  note text not null default '' check (length(note) <= 500),
  created_by_user_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not isempty(stay_range) and lower_inc(stay_range) and not upper_inc(stay_range)),
  exclude using gist (
    apartment_id with =,
    stay_range with &&
  ) where (status in ('blocked', 'confirmed'))
);

create table public.apartment_inquiries (
  id uuid primary key default gen_random_uuid(),
  apartment_id uuid not null references public.apartment_listings(id) on delete restrict,
  stay_range daterange not null,
  guests smallint not null check (guests between 1 and 40),
  guest_name text not null check (length(btrim(guest_name)) between 2 and 160),
  guest_email text not null check (guest_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  guest_phone text not null default '' check (length(guest_phone) <= 50),
  guest_message text not null default '' check (length(guest_message) <= 2000),
  status text not null default 'awaiting_confirmation' check (status in ('awaiting_confirmation', 'confirmed', 'declined', 'cancelled')),
  price_currency_snapshot text not null check (price_currency_snapshot ~ '^[A-Z]{3}$'),
  nightly_price_minor_snapshot bigint not null check (nightly_price_minor_snapshot > 0),
  minimum_stay_nights_snapshot smallint not null check (minimum_stay_nights_snapshot between 1 and 365),
  deposit_minor_snapshot bigint,
  idempotency_key_hash text not null check (length(idempotency_key_hash) = 64),
  request_fingerprint text not null check (length(request_fingerprint) = 64),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (apartment_id, idempotency_key_hash),
  check (not isempty(stay_range) and lower_inc(stay_range) and not upper_inc(stay_range))
);

create table public.apartment_provider_contracts (
  provider_code text primary key,
  integration_mode text not null check (integration_mode = 'affiliate_handoff'),
  lifecycle_status text not null check (lifecycle_status in ('planned', 'disabled')),
  enabled boolean not null default false check (enabled = false),
  provides_availability boolean not null default false check (provides_availability = false),
  provides_pricing boolean not null default false check (provides_pricing = false),
  provides_checkout boolean not null default false check (provides_checkout = false),
  updated_at timestamptz not null default now()
);

insert into public.apartment_provider_contracts
  (provider_code, integration_mode, lifecycle_status, enabled)
values
  ('booking_com', 'affiliate_handoff', 'planned', false),
  ('yandex_travel', 'affiliate_handoff', 'planned', false)
on conflict (provider_code) do nothing;

create index apartment_listings_owner_idx on public.apartment_listings(owner_user_id, status, updated_at desc);
create index apartment_listings_public_idx on public.apartment_listings(market_id, status, published_at desc) where status = 'published';
create index apartment_images_apartment_idx on public.apartment_images(apartment_id, position);
create index apartment_availability_apartment_idx on public.apartment_availability_blocks(apartment_id, lower(stay_range));
create index apartment_availability_creator_idx on public.apartment_availability_blocks(created_by_user_id);
create index apartment_inquiries_apartment_status_idx on public.apartment_inquiries(apartment_id, status, created_at desc);

alter table public.apartment_listings enable row level security;
alter table public.apartment_private_locations enable row level security;
alter table public.apartment_images enable row level security;
alter table public.apartment_availability_blocks enable row level security;
alter table public.apartment_inquiries enable row level security;
alter table public.apartment_provider_contracts enable row level security;

revoke all on public.apartment_listings, public.apartment_private_locations,
  public.apartment_images, public.apartment_availability_blocks,
  public.apartment_inquiries, public.apartment_provider_contracts
from public, anon, authenticated;
grant select, insert, update, delete on public.apartment_listings,
  public.apartment_private_locations, public.apartment_images,
  public.apartment_availability_blocks, public.apartment_inquiries
to service_role;
grant select on public.apartment_provider_contracts to service_role;

create or replace function public.apartment_save_draft(
  p_apartment_id uuid,
  p_expected_version integer,
  p_actor_user_id uuid,
  p_owner_user_id uuid,
  p_actor_is_admin boolean,
  p_input jsonb,
  p_images jsonb
)
returns public.apartment_listings
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_listing public.apartment_listings%rowtype;
  v_amenities text[] := coalesce(array(select jsonb_array_elements_text(coalesce(p_input->'amenities', '[]'::jsonb))), '{}');
  v_rules text[] := coalesce(array(select jsonb_array_elements_text(coalesce(p_input->'houseRules', '[]'::jsonb))), '{}');
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = p_input->>'propertyTimezone') then
    raise exception 'APARTMENT_INVALID_TIMEZONE' using errcode = '23514';
  end if;
  if p_apartment_id is null then
    insert into public.apartment_listings(
      market_id, country_code, slug, owner_user_id, created_by_user_id, source_owner_type,
      property_timezone, title, summary, description, locality, region, public_location_note,
      public_latitude, public_longitude, max_guests, bedrooms, beds, bathrooms, amenities,
      house_rules, nightly_price_minor, currency, minimum_stay_nights, deposit_minor,
      deposit_disclosure, cancellation_disclosure)
    values (
      p_input->>'marketId', p_input->>'countryCode', p_input->>'slug', p_owner_user_id,
      p_actor_user_id, case when p_actor_is_admin then 'admin' else 'organizer' end,
      p_input->>'propertyTimezone', p_input->>'title', p_input->>'summary', p_input->>'description',
      p_input->>'locality', p_input->>'region', coalesce(p_input->>'publicLocationNote', ''),
      nullif(p_input->>'publicLatitude', '')::numeric, nullif(p_input->>'publicLongitude', '')::numeric,
      (p_input->>'maxGuests')::smallint, (p_input->>'bedrooms')::smallint,
      (p_input->>'beds')::smallint, (p_input->>'bathrooms')::numeric, v_amenities, v_rules,
      (p_input->>'nightlyPriceMinor')::bigint, p_input->>'currency',
      (p_input->>'minimumStayNights')::smallint, nullif(p_input->>'depositMinor', '')::bigint,
      coalesce(p_input->>'depositDisclosure', ''), coalesce(p_input->>'cancellationDisclosure', ''))
    returning * into v_listing;
  else
    select * into v_listing from public.apartment_listings where id = p_apartment_id for update;
    if not found then raise exception 'APARTMENT_NOT_FOUND' using errcode = 'P0002'; end if;
    if not p_actor_is_admin and v_listing.owner_user_id <> p_actor_user_id then
      raise exception 'APARTMENT_FORBIDDEN' using errcode = '42501';
    end if;
    if v_listing.row_version <> p_expected_version then
      raise exception 'APARTMENT_VERSION_CONFLICT' using errcode = '40001';
    end if;
    if not p_actor_is_admin and v_listing.status <> 'draft' then
      raise exception 'APARTMENT_INVALID_TRANSITION' using errcode = '23514';
    end if;
    update public.apartment_listings set
      market_id = p_input->>'marketId', country_code = p_input->>'countryCode', slug = p_input->>'slug',
      owner_user_id = case when p_actor_is_admin then p_owner_user_id else owner_user_id end,
      property_timezone = p_input->>'propertyTimezone', title = p_input->>'title',
      summary = p_input->>'summary', description = p_input->>'description',
      locality = p_input->>'locality', region = p_input->>'region',
      public_location_note = coalesce(p_input->>'publicLocationNote', ''),
      public_latitude = nullif(p_input->>'publicLatitude', '')::numeric,
      public_longitude = nullif(p_input->>'publicLongitude', '')::numeric,
      max_guests = (p_input->>'maxGuests')::smallint, bedrooms = (p_input->>'bedrooms')::smallint,
      beds = (p_input->>'beds')::smallint, bathrooms = (p_input->>'bathrooms')::numeric,
      amenities = v_amenities, house_rules = v_rules,
      nightly_price_minor = (p_input->>'nightlyPriceMinor')::bigint, currency = p_input->>'currency',
      minimum_stay_nights = (p_input->>'minimumStayNights')::smallint,
      deposit_minor = nullif(p_input->>'depositMinor', '')::bigint,
      deposit_disclosure = coalesce(p_input->>'depositDisclosure', ''),
      cancellation_disclosure = coalesce(p_input->>'cancellationDisclosure', ''),
      row_version = row_version + 1, updated_at = now()
    where id = p_apartment_id returning * into v_listing;
  end if;

  insert into public.apartment_private_locations(apartment_id, exact_address, access_instructions, updated_by_user_id)
  values (v_listing.id, p_input->>'exactAddress', coalesce(p_input->>'accessInstructions', ''), p_actor_user_id)
  on conflict (apartment_id) do update set exact_address = excluded.exact_address,
    access_instructions = excluded.access_instructions, updated_by_user_id = excluded.updated_by_user_id,
    updated_at = now();

  delete from public.apartment_images where apartment_id = v_listing.id;
  insert into public.apartment_images(apartment_id, media_ref, alt_text, rights_holder, rights_source_url, license_code, position)
  select v_listing.id, x.media_ref, x.alt_text, x.rights_holder, nullif(x.rights_source_url, ''), x.license_code, x.position
  from jsonb_to_recordset(coalesce(p_images, '[]'::jsonb))
    as x(media_ref text, alt_text text, rights_holder text, rights_source_url text, license_code text, position smallint);

  if v_listing.status = 'published' and (
    length(btrim(v_listing.description)) < 80
    or length(btrim(v_listing.summary)) < 20
    or length(btrim(v_listing.cancellation_disclosure)) < 10
    or not exists (select 1 from public.apartment_images where apartment_id = v_listing.id)
  ) then raise exception 'APARTMENT_INCOMPLETE' using errcode = '23514'; end if;

  insert into public.admin_audit_log(actor_user_id, action, entity_type, entity_id, payload)
  values (p_actor_user_id, case when p_apartment_id is null then 'apartment.created' else 'apartment.updated' end,
    'apartment', v_listing.id::text,
    jsonb_build_object('ownerUserId', v_listing.owner_user_id, 'rowVersion', v_listing.row_version,
      'marketId', v_listing.market_id, 'imageCount', jsonb_array_length(coalesce(p_images, '[]'::jsonb))));
  return v_listing;
end;
$$;

create or replace function public.apartment_submit_for_review(
  p_apartment_id uuid,
  p_expected_version integer,
  p_actor_user_id uuid
)
returns public.apartment_listings
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_listing public.apartment_listings%rowtype;
begin
  select * into v_listing from public.apartment_listings where id = p_apartment_id for update;
  if not found then raise exception 'APARTMENT_NOT_FOUND' using errcode = 'P0002'; end if;
  if v_listing.owner_user_id <> p_actor_user_id then raise exception 'APARTMENT_FORBIDDEN' using errcode = '42501'; end if;
  if v_listing.row_version <> p_expected_version then raise exception 'APARTMENT_VERSION_CONFLICT' using errcode = '40001'; end if;
  if v_listing.status <> 'draft' then raise exception 'APARTMENT_INVALID_TRANSITION' using errcode = '23514'; end if;
  if length(btrim(v_listing.description)) < 80
    or length(btrim(v_listing.summary)) < 20
    or length(btrim(v_listing.cancellation_disclosure)) < 10
    or not exists (select 1 from public.apartment_images where apartment_id = v_listing.id)
    or not exists (select 1 from public.apartment_private_locations where apartment_id = v_listing.id)
  then raise exception 'APARTMENT_INCOMPLETE' using errcode = '23514'; end if;

  update public.apartment_listings set
    status = 'review', submitted_at = now(), row_version = row_version + 1, updated_at = now()
  where id = v_listing.id returning * into v_listing;

  insert into public.moderation_queue(entity_type, entity_id, status, submitted_by, metadata)
  values ('apartment', v_listing.id::text, 'pending', p_actor_user_id,
    jsonb_build_object('marketId', v_listing.market_id, 'countryCode', v_listing.country_code))
  on conflict (entity_type, entity_id) do update set
    status = 'pending', submitted_by = excluded.submitted_by, resolved_at = null,
    resolved_by = null, metadata = excluded.metadata, updated_at = now();

  insert into public.admin_audit_log(actor_user_id, action, entity_type, entity_id, payload)
  values (p_actor_user_id, 'apartment.submitted', 'apartment', v_listing.id::text,
    jsonb_build_object('rowVersion', v_listing.row_version));
  return v_listing;
end;
$$;

create or replace function public.apartment_moderate(
  p_apartment_id uuid,
  p_expected_version integer,
  p_actor_user_id uuid,
  p_action text,
  p_note text default null
)
returns public.apartment_listings
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_listing public.apartment_listings%rowtype;
  v_next_status text;
begin
  select * into v_listing from public.apartment_listings where id = p_apartment_id for update;
  if not found then raise exception 'APARTMENT_NOT_FOUND' using errcode = 'P0002'; end if;
  if v_listing.row_version <> p_expected_version then raise exception 'APARTMENT_VERSION_CONFLICT' using errcode = '40001'; end if;
  if p_action = 'publish' and v_listing.status = 'review' then v_next_status := 'published';
  elsif p_action = 'return_to_draft' and v_listing.status = 'review' then v_next_status := 'draft';
  elsif p_action = 'archive' and v_listing.status in ('draft', 'review', 'published') then v_next_status := 'archived';
  else raise exception 'APARTMENT_INVALID_TRANSITION' using errcode = '23514'; end if;
  if v_next_status = 'published' and (
    not exists (select 1 from public.apartment_images where apartment_id = v_listing.id)
    or not exists (select 1 from public.apartment_private_locations where apartment_id = v_listing.id)
  ) then raise exception 'APARTMENT_INCOMPLETE' using errcode = '23514'; end if;

  update public.apartment_listings set
    status = v_next_status,
    published_at = case when v_next_status = 'published' then now() else published_at end,
    archived_at = case when v_next_status = 'archived' then now() else null end,
    row_version = row_version + 1,
    updated_at = now()
  where id = v_listing.id returning * into v_listing;

  update public.moderation_queue set
    status = case when v_next_status = 'published' then 'approved'
                  when v_next_status = 'draft' then 'rejected' else 'cancelled' end,
    reason = nullif(left(coalesce(p_note, ''), 1000), ''), resolved_at = now(),
    resolved_by = p_actor_user_id, updated_at = now()
  where entity_type = 'apartment' and entity_id = v_listing.id::text;

  insert into public.admin_audit_log(actor_user_id, action, entity_type, entity_id, payload)
  values (p_actor_user_id, 'apartment.' || p_action, 'apartment', v_listing.id::text,
    jsonb_build_object('from', case when v_next_status = 'published' then 'review' else null end,
      'to', v_next_status, 'rowVersion', v_listing.row_version, 'hasNote', nullif(btrim(coalesce(p_note, '')), '') is not null));
  return v_listing;
end;
$$;

create or replace function public.apartment_replace_availability(
  p_apartment_id uuid,
  p_expected_version integer,
  p_actor_user_id uuid,
  p_blocks jsonb
)
returns setof public.apartment_availability_blocks
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_listing public.apartment_listings%rowtype;
begin
  select * into v_listing
  from public.apartment_listings
  where id = p_apartment_id
  for update;
  if not found then raise exception 'APARTMENT_NOT_FOUND' using errcode = 'P0002'; end if;
  if v_listing.owner_user_id <> p_actor_user_id then
    raise exception 'APARTMENT_FORBIDDEN' using errcode = '42501';
  end if;
  if v_listing.row_version <> p_expected_version then
    raise exception 'APARTMENT_VERSION_CONFLICT' using errcode = '40001';
  end if;
  if jsonb_typeof(coalesce(p_blocks, '[]'::jsonb)) <> 'array'
    or exists (
      select 1
      from jsonb_to_recordset(coalesce(p_blocks, '[]'::jsonb))
        as invalid(start_date date, end_date date, note text)
      where invalid.start_date is null
        or invalid.end_date is null
        or invalid.end_date <= invalid.start_date
    )
  then
    raise exception 'APARTMENT_INVALID_AVAILABILITY' using errcode = '23514';
  end if;
  delete from public.apartment_availability_blocks
  where apartment_id = p_apartment_id and status = 'blocked' and source = 'manual';
  insert into public.apartment_availability_blocks(apartment_id, stay_range, status, source, note, created_by_user_id)
  select p_apartment_id, daterange(x.start_date, x.end_date, '[)'), 'blocked', 'manual', left(coalesce(x.note, ''), 500), p_actor_user_id
  from jsonb_to_recordset(coalesce(p_blocks, '[]'::jsonb)) as x(start_date date, end_date date, note text)
  where x.start_date is not null and x.end_date > x.start_date;
  update public.apartment_listings
  set row_version = row_version + 1, updated_at = now()
  where id = p_apartment_id
  returning * into v_listing;
  insert into public.admin_audit_log(actor_user_id, action, entity_type, entity_id, payload)
  values (p_actor_user_id, 'apartment.availability_replaced', 'apartment', p_apartment_id::text,
    jsonb_build_object(
      'blockCount', jsonb_array_length(coalesce(p_blocks, '[]'::jsonb)),
      'rowVersion', v_listing.row_version
    ));
  return query select * from public.apartment_availability_blocks where apartment_id = p_apartment_id order by lower(stay_range);
end;
$$;

create or replace function public.apartment_create_inquiry(
  p_apartment_id uuid,
  p_start_date date,
  p_end_date date,
  p_guests smallint,
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text,
  p_guest_message text,
  p_idempotency_key_hash text,
  p_request_fingerprint text
)
returns public.apartment_inquiries
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_listing public.apartment_listings%rowtype;
  v_existing public.apartment_inquiries%rowtype;
  v_inquiry public.apartment_inquiries%rowtype;
  v_range daterange := daterange(p_start_date, p_end_date, '[)');
begin
  select * into v_listing from public.apartment_listings where id = p_apartment_id and status = 'published';
  if not found then raise exception 'APARTMENT_NOT_AVAILABLE' using errcode = 'P0002'; end if;
  select * into v_existing from public.apartment_inquiries
    where apartment_id = p_apartment_id and idempotency_key_hash = p_idempotency_key_hash;
  if found then
    if v_existing.request_fingerprint <> p_request_fingerprint then
      raise exception 'APARTMENT_IDEMPOTENCY_CONFLICT' using errcode = '23505';
    end if;
    return v_existing;
  end if;
  if p_end_date <= p_start_date or p_guests > v_listing.max_guests
    or (p_end_date - p_start_date) < v_listing.minimum_stay_nights
  then raise exception 'APARTMENT_INVALID_REQUEST' using errcode = '23514'; end if;
  if exists (select 1 from public.apartment_availability_blocks
    where apartment_id = p_apartment_id and status in ('blocked', 'confirmed') and stay_range && v_range)
  then raise exception 'APARTMENT_DATES_UNAVAILABLE' using errcode = '23P01'; end if;

  insert into public.apartment_inquiries(
    apartment_id, stay_range, guests, guest_name, guest_email, guest_phone, guest_message,
    price_currency_snapshot, nightly_price_minor_snapshot, minimum_stay_nights_snapshot,
    deposit_minor_snapshot, idempotency_key_hash, request_fingerprint)
  values (p_apartment_id, v_range, p_guests, left(btrim(p_guest_name), 160), lower(btrim(p_guest_email)),
    left(btrim(coalesce(p_guest_phone, '')), 50), left(btrim(coalesce(p_guest_message, '')), 2000),
    v_listing.currency, v_listing.nightly_price_minor, v_listing.minimum_stay_nights,
    v_listing.deposit_minor, p_idempotency_key_hash, p_request_fingerprint)
  on conflict (apartment_id, idempotency_key_hash) do nothing
  returning * into v_inquiry;

  if not found then
    select * into v_existing
    from public.apartment_inquiries
    where apartment_id = p_apartment_id
      and idempotency_key_hash = p_idempotency_key_hash;
    if v_existing.request_fingerprint <> p_request_fingerprint then
      raise exception 'APARTMENT_IDEMPOTENCY_CONFLICT' using errcode = '23505';
    end if;
    return v_existing;
  end if;

  insert into public.admin_notifications(type, title, body, href, metadata)
  values (
    'new_lead',
    'Новая заявка на апартаменты',
    v_listing.title || ': ' || p_start_date::text || ' — ' || p_end_date::text ||
      ', гостей: ' || p_guests::text,
    '/admin/marketplace/apartments',
    jsonb_build_object('entity_type', 'apartment_inquiry', 'entity_id', v_inquiry.id)
  );
  return v_inquiry;
end;
$$;

revoke all on function public.apartment_submit_for_review(uuid, integer, uuid) from public, anon, authenticated;
revoke all on function public.apartment_save_draft(uuid, integer, uuid, uuid, boolean, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.apartment_moderate(uuid, integer, uuid, text, text) from public, anon, authenticated;
revoke all on function public.apartment_replace_availability(uuid, integer, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.apartment_create_inquiry(uuid, date, date, smallint, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.apartment_submit_for_review(uuid, integer, uuid) to service_role;
grant execute on function public.apartment_save_draft(uuid, integer, uuid, uuid, boolean, jsonb, jsonb) to service_role;
grant execute on function public.apartment_moderate(uuid, integer, uuid, text, text) to service_role;
grant execute on function public.apartment_replace_availability(uuid, integer, uuid, jsonb) to service_role;
grant execute on function public.apartment_create_inquiry(uuid, date, date, smallint, text, text, text, text, text, text) to service_role;

comment on table public.apartment_private_locations is 'Private exact apartment addresses; never expose through public DTO or SEO.';
comment on table public.apartment_inquiries is 'Request-first apartment inquiries; awaiting_confirmation is not a booking or payment promise.';
