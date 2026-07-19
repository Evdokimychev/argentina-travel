-- Shared native mobility foundation. LocalRent and Intui remain independent
-- affiliate providers; native inventory never impersonates partner availability.

create extension if not exists btree_gist with schema extensions;
create extension if not exists pgcrypto with schema extensions;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'mobility-private-documents',
  'mobility-private-documents',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table public.mobility_providers (
  id uuid primary key default gen_random_uuid(),
  provider_key text not null unique,
  owner_user_id uuid references public.profiles (id) on delete restrict,
  display_name text not null,
  provider_kind text not null,
  source_ownership text not null,
  capability_mode text not null,
  verification_status text not null default 'unverified',
  health_status text not null default 'unknown',
  status text not null default 'active',
  row_version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mobility_provider_key_check check (provider_key ~ '^[a-z0-9][a-z0-9:_-]{1,119}$'),
  constraint mobility_provider_kind_check check (provider_kind in ('platform_native', 'organizer_native', 'affiliate_partner')),
  constraint mobility_provider_source_check check (source_ownership in ('platform', 'organizer', 'partner')),
  constraint mobility_provider_capability_check check (capability_mode in ('native_request', 'native_booking', 'affiliate_handoff', 'planned')),
  constraint mobility_provider_verification_check check (verification_status in ('unverified', 'pending', 'verified', 'rejected', 'expired')),
  constraint mobility_provider_health_check check (health_status in ('unknown', 'healthy', 'degraded', 'unavailable')),
  constraint mobility_provider_status_check check (status in ('active', 'paused', 'archived')),
  constraint mobility_provider_ownership_check check (
    (provider_kind = 'organizer_native' and owner_user_id is not null and source_ownership = 'organizer')
    or (provider_kind <> 'organizer_native' and owner_user_id is null)
  ),
  constraint mobility_provider_mode_check check (
    (provider_kind = 'affiliate_partner' and capability_mode = 'affiliate_handoff')
    or (provider_kind <> 'affiliate_partner' and capability_mode in ('native_request', 'native_booking', 'planned'))
  )
);

create index mobility_providers_owner_idx on public.mobility_providers (owner_user_id) where owner_user_id is not null;

create table public.mobility_provider_markets (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.mobility_providers (id) on delete cascade,
  vertical text not null,
  market_id text not null,
  country_code text not null,
  timezone text not null,
  source_currency text not null,
  display_currency text not null,
  capability_mode text not null,
  readiness_status text not null default 'requires_verification',
  health_status text not null default 'unknown',
  public_enabled boolean not null default false,
  handoff_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_id, vertical, market_id),
  constraint mobility_provider_market_vertical_check check (vertical in ('rental', 'transfer')),
  constraint mobility_provider_market_id_check check (market_id ~ '^[a-z0-9][a-z0-9_-]{1,39}$'),
  constraint mobility_provider_market_country_check check (country_code ~ '^[A-Z]{2}$'),
  constraint mobility_provider_market_currency_check check (source_currency ~ '^[A-Z]{3}$' and display_currency ~ '^[A-Z]{3}$'),
  constraint mobility_provider_market_timezone_check check (length(timezone) between 3 and 80),
  constraint mobility_provider_market_capability_check check (capability_mode in ('native_request', 'native_booking', 'affiliate_handoff', 'planned')),
  constraint mobility_provider_market_readiness_check check (readiness_status in ('requires_verification', 'manual_handoff', 'verified', 'blocked')),
  constraint mobility_provider_market_health_check check (health_status in ('unknown', 'healthy', 'degraded', 'unavailable')),
  constraint mobility_provider_market_handoff_check check (
    (capability_mode = 'affiliate_handoff' and handoff_path is not null and handoff_path like '/%')
    or (capability_mode <> 'affiliate_handoff' and handoff_path is null)
  )
);

create index mobility_provider_markets_public_idx
  on public.mobility_provider_markets (vertical, market_id, public_enabled)
  where public_enabled = true;

create table public.mobility_fleets (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.mobility_providers (id) on delete restrict,
  owner_user_id uuid not null references public.profiles (id) on delete restrict,
  market_id text not null,
  country_code text not null,
  timezone text not null,
  name text not null,
  status text not null default 'draft',
  row_version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id, market_id, name),
  constraint mobility_fleet_market_check check (market_id ~ '^[a-z0-9][a-z0-9_-]{1,39}$'),
  constraint mobility_fleet_country_check check (country_code ~ '^[A-Z]{2}$'),
  constraint mobility_fleet_status_check check (status in ('draft', 'review', 'published', 'archived'))
);

create index mobility_fleets_provider_idx on public.mobility_fleets (provider_id);
create index mobility_fleets_owner_idx on public.mobility_fleets (owner_user_id, status);

create table public.mobility_vehicles (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.mobility_providers (id) on delete restrict,
  fleet_id uuid references public.mobility_fleets (id) on delete restrict,
  owner_user_id uuid not null references public.profiles (id) on delete restrict,
  market_id text not null,
  country_code text not null,
  timezone text not null,
  public_name text not null,
  vehicle_class text not null,
  seat_capacity smallint not null,
  luggage_capacity smallint not null default 0,
  active_interval tstzrange,
  verification_status text not null default 'unverified',
  documents_valid_until date,
  status text not null default 'draft',
  row_version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mobility_vehicle_market_check check (market_id ~ '^[a-z0-9][a-z0-9_-]{1,39}$'),
  constraint mobility_vehicle_country_check check (country_code ~ '^[A-Z]{2}$'),
  constraint mobility_vehicle_class_check check (vehicle_class in ('economy', 'comfort', 'business', 'suv', 'minivan', 'van', 'bus', 'special')),
  constraint mobility_vehicle_capacity_check check (seat_capacity between 1 and 80 and luggage_capacity between 0 and 100),
  constraint mobility_vehicle_verification_check check (verification_status in ('unverified', 'pending', 'verified', 'rejected', 'expired')),
  constraint mobility_vehicle_status_check check (status in ('draft', 'review', 'published', 'archived')),
  constraint mobility_vehicle_publish_check check (
    status <> 'published'
    or (verification_status = 'verified' and documents_valid_until is not null)
  ),
  constraint mobility_vehicle_interval_check check (active_interval is null or not isempty(active_interval))
);

create index mobility_vehicles_provider_idx on public.mobility_vehicles (provider_id);
create index mobility_vehicles_fleet_idx on public.mobility_vehicles (fleet_id) where fleet_id is not null;
create index mobility_vehicles_owner_idx on public.mobility_vehicles (owner_user_id, status);
create index mobility_vehicles_market_idx on public.mobility_vehicles (market_id, status);

create table public.mobility_private_documents (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references public.mobility_providers (id) on delete cascade,
  vehicle_id uuid references public.mobility_vehicles (id) on delete cascade,
  owner_user_id uuid not null references public.profiles (id) on delete restrict,
  document_type text not null,
  storage_object_ref text not null,
  identifier_last4 text,
  expires_at date,
  verification_status text not null default 'pending',
  verified_by uuid references public.profiles (id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  constraint mobility_private_document_parent_check check ((provider_id is not null)::int + (vehicle_id is not null)::int = 1),
  constraint mobility_private_document_status_check check (verification_status in ('pending', 'verified', 'rejected', 'expired')),
  constraint mobility_private_document_ref_check check (storage_object_ref !~* '^https?://')
);

create index mobility_private_documents_provider_idx on public.mobility_private_documents (provider_id) where provider_id is not null;
create index mobility_private_documents_vehicle_idx on public.mobility_private_documents (vehicle_id) where vehicle_id is not null;
create index mobility_private_documents_owner_idx on public.mobility_private_documents (owner_user_id);
create index mobility_private_documents_verified_by_idx on public.mobility_private_documents (verified_by) where verified_by is not null;

create table public.mobility_private_locations (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles (id) on delete restrict,
  market_id text not null,
  country_code text not null,
  timezone text not null,
  public_label text not null,
  exact_address jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mobility_private_location_market_check check (market_id ~ '^[a-z0-9][a-z0-9_-]{1,39}$'),
  constraint mobility_private_location_country_check check (country_code ~ '^[A-Z]{2}$'),
  constraint mobility_private_location_address_check check (jsonb_typeof(exact_address) = 'object')
);

create index mobility_private_locations_owner_idx on public.mobility_private_locations (owner_user_id, market_id);

create table public.mobility_rental_offers (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.mobility_providers (id) on delete restrict,
  vehicle_id uuid not null references public.mobility_vehicles (id) on delete restrict,
  owner_user_id uuid not null references public.profiles (id) on delete restrict,
  market_id text not null,
  country_code text not null,
  pickup_timezone text not null,
  dropoff_timezone text not null,
  slug text not null,
  title text not null,
  pickup_public_label text not null,
  pickup_location_id uuid references public.mobility_private_locations (id) on delete restrict,
  dropoff_public_label text not null,
  dropoff_location_id uuid references public.mobility_private_locations (id) on delete restrict,
  source_currency text not null,
  display_currency text not null,
  daily_rate_minor bigint not null,
  deposit_minor bigint not null default 0,
  mileage_policy text not null,
  mileage_limit_km integer,
  fuel_policy text not null,
  insurance_summary text not null,
  additional_driver_policy text not null default 'on_request',
  capability_mode text not null default 'native_request',
  status text not null default 'draft',
  row_version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (market_id, slug),
  constraint mobility_rental_market_check check (market_id ~ '^[a-z0-9][a-z0-9_-]{1,39}$'),
  constraint mobility_rental_country_check check (country_code ~ '^[A-Z]{2}$'),
  constraint mobility_rental_currency_check check (source_currency ~ '^[A-Z]{3}$' and display_currency ~ '^[A-Z]{3}$'),
  constraint mobility_rental_rate_check check (daily_rate_minor >= 0 and deposit_minor >= 0),
  constraint mobility_rental_mileage_check check (mileage_policy in ('unlimited', 'limited') and (mileage_policy = 'unlimited' or mileage_limit_km > 0)),
  constraint mobility_rental_fuel_check check (fuel_policy in ('same_to_same', 'full_to_full', 'prepaid', 'custom')),
  constraint mobility_rental_capability_check check (capability_mode in ('native_request', 'native_booking', 'planned')),
  constraint mobility_rental_status_check check (status in ('draft', 'review', 'published', 'archived'))
);

create index mobility_rental_offers_provider_idx on public.mobility_rental_offers (provider_id);
create index mobility_rental_offers_vehicle_idx on public.mobility_rental_offers (vehicle_id);
create index mobility_rental_offers_owner_idx on public.mobility_rental_offers (owner_user_id, status);
create index mobility_rental_offers_public_idx on public.mobility_rental_offers (market_id, updated_at desc) where status = 'published';
create index mobility_rental_pickup_location_idx on public.mobility_rental_offers (pickup_location_id) where pickup_location_id is not null;
create index mobility_rental_dropoff_location_idx on public.mobility_rental_offers (dropoff_location_id) where dropoff_location_id is not null;

create table public.mobility_transfer_services (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.mobility_providers (id) on delete restrict,
  vehicle_id uuid not null references public.mobility_vehicles (id) on delete restrict,
  owner_user_id uuid not null references public.profiles (id) on delete restrict,
  market_id text not null,
  country_code text not null,
  pickup_timezone text not null,
  dropoff_timezone text not null,
  slug text not null,
  title text not null,
  origin_public_label text not null,
  origin_location_id uuid references public.mobility_private_locations (id) on delete restrict,
  destination_public_label text not null,
  destination_location_id uuid references public.mobility_private_locations (id) on delete restrict,
  source_currency text not null,
  display_currency text not null,
  base_rate_minor bigint not null,
  included_distance_km integer,
  extra_km_rate_minor bigint,
  meeting_policy text not null,
  flight_delay_policy text not null,
  no_show_policy text not null,
  confirmation_mode text not null default 'manual',
  capability_mode text not null default 'native_request',
  status text not null default 'draft',
  row_version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (market_id, slug),
  constraint mobility_transfer_market_check check (market_id ~ '^[a-z0-9][a-z0-9_-]{1,39}$'),
  constraint mobility_transfer_country_check check (country_code ~ '^[A-Z]{2}$'),
  constraint mobility_transfer_currency_check check (source_currency ~ '^[A-Z]{3}$' and display_currency ~ '^[A-Z]{3}$'),
  constraint mobility_transfer_rate_check check (base_rate_minor >= 0 and coalesce(extra_km_rate_minor, 0) >= 0 and coalesce(included_distance_km, 0) >= 0),
  constraint mobility_transfer_confirmation_check check (confirmation_mode in ('manual', 'operator_review', 'provider_confirmation')),
  constraint mobility_transfer_capability_check check (capability_mode in ('native_request', 'native_booking', 'planned')),
  constraint mobility_transfer_status_check check (status in ('draft', 'review', 'published', 'archived'))
);

create index mobility_transfer_services_provider_idx on public.mobility_transfer_services (provider_id);
create index mobility_transfer_services_vehicle_idx on public.mobility_transfer_services (vehicle_id);
create index mobility_transfer_services_owner_idx on public.mobility_transfer_services (owner_user_id, status);
create index mobility_transfer_services_public_idx on public.mobility_transfer_services (market_id, updated_at desc) where status = 'published';
create index mobility_transfer_origin_location_idx on public.mobility_transfer_services (origin_location_id) where origin_location_id is not null;
create index mobility_transfer_destination_location_idx on public.mobility_transfer_services (destination_location_id) where destination_location_id is not null;

create table public.mobility_requests (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.mobility_providers (id) on delete restrict,
  requester_user_id uuid references public.profiles (id) on delete set null,
  vertical text not null,
  product_id uuid not null,
  market_id text not null,
  country_code text not null,
  timezone text not null,
  source_currency text not null,
  display_currency text not null,
  quoted_price_minor bigint,
  idempotency_key_hash text not null,
  request_fingerprint text not null,
  status text not null default 'submitted',
  row_version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_id, idempotency_key_hash),
  constraint mobility_request_vertical_check check (vertical in ('rental', 'transfer')),
  constraint mobility_request_market_check check (market_id ~ '^[a-z0-9][a-z0-9_-]{1,39}$'),
  constraint mobility_request_country_check check (country_code ~ '^[A-Z]{2}$'),
  constraint mobility_request_currency_check check (source_currency ~ '^[A-Z]{3}$' and display_currency ~ '^[A-Z]{3}$'),
  constraint mobility_request_price_check check (quoted_price_minor is null or quoted_price_minor >= 0),
  constraint mobility_request_fingerprint_check check (request_fingerprint ~ '^[a-f0-9]{64}$'),
  constraint mobility_request_status_check check (status in ('submitted', 'in_review', 'confirmed', 'rejected', 'cancelled', 'completed', 'no_show'))
);

create index mobility_requests_requester_idx on public.mobility_requests (requester_user_id) where requester_user_id is not null;
create index mobility_requests_product_idx on public.mobility_requests (vertical, product_id, created_at desc);
create index mobility_requests_status_idx on public.mobility_requests (status, created_at);

create table public.mobility_request_private (
  request_id uuid primary key references public.mobility_requests (id) on delete cascade,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  pickup_details jsonb not null default '{}',
  customer_note text,
  created_at timestamptz not null default now(),
  constraint mobility_request_private_details_check check (
    jsonb_typeof(pickup_details) = 'object' and octet_length(pickup_details::text) <= 8000
  ),
  constraint mobility_request_private_contact_check check (
    length(contact_name) between 2 and 120
    and length(contact_email) between 3 and 320
    and (contact_phone is null or length(contact_phone) <= 40)
    and (customer_note is null or length(customer_note) <= 2000)
  )
);

create table public.mobility_vehicle_allocations (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.mobility_vehicles (id) on delete restrict,
  request_id uuid references public.mobility_requests (id) on delete restrict,
  owner_user_id uuid not null references public.profiles (id) on delete restrict,
  vertical text not null,
  product_id uuid not null,
  allocation_interval tstzrange not null,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mobility_allocation_vertical_check check (vertical in ('rental', 'transfer')),
  constraint mobility_allocation_status_check check (status in ('tentative', 'confirmed', 'blocked', 'cancelled')),
  constraint mobility_allocation_interval_check check (not isempty(allocation_interval)),
  constraint mobility_vehicle_allocation_no_overlap exclude using gist (
    vehicle_id with =,
    allocation_interval with &&
  ) where (status in ('confirmed', 'blocked'))
);

create index mobility_vehicle_allocations_request_idx on public.mobility_vehicle_allocations (request_id) where request_id is not null;
create unique index mobility_vehicle_allocations_active_request_idx
  on public.mobility_vehicle_allocations (request_id)
  where request_id is not null and status in ('tentative', 'confirmed', 'blocked');
create index mobility_vehicle_allocations_owner_idx on public.mobility_vehicle_allocations (owner_user_id, status);
create index mobility_vehicle_allocations_product_idx on public.mobility_vehicle_allocations (vertical, product_id);

create table public.mobility_analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  operation_id uuid not null,
  provider_id uuid not null references public.mobility_providers (id) on delete restrict,
  vertical text not null,
  market_id text not null,
  product_id uuid,
  outcome text not null,
  placement text not null,
  created_at timestamptz not null default now(),
  unique (event_name, operation_id),
  constraint mobility_analytics_event_check check (event_name in ('mobility_capability_view', 'mobility_transition', 'mobility_error')),
  constraint mobility_analytics_vertical_check check (vertical in ('rental', 'transfer')),
  constraint mobility_analytics_outcome_check check (outcome in (
    'native_request_created', 'affiliate_handoff', 'disabled', 'in_review',
    'confirmed', 'rejected', 'cancelled', 'completed', 'no_show', 'failed'
  )),
  constraint mobility_analytics_placement_check check (placement ~ '^[a-z0-9][a-z0-9:_-]{0,79}$')
);

create index mobility_analytics_market_idx on public.mobility_analytics_events (market_id, vertical, created_at desc);
create index mobility_analytics_provider_idx on public.mobility_analytics_events (provider_id, created_at desc);

-- All access is server-mediated. This keeps exact locations, documents and
-- request contacts outside browser-accessible PostgREST roles.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'mobility_providers', 'mobility_provider_markets', 'mobility_fleets',
    'mobility_vehicles', 'mobility_private_documents', 'mobility_private_locations',
    'mobility_rental_offers', 'mobility_transfer_services', 'mobility_requests',
    'mobility_request_private', 'mobility_vehicle_allocations', 'mobility_analytics_events'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from public, anon, authenticated', table_name);
    execute format('grant all on table public.%I to service_role', table_name);
  end loop;
end $$;

-- Generic provider registry: adding another provider is a data operation. The
-- application does not need a provider-specific source switch.
insert into public.mobility_providers (
  provider_key, display_name, provider_kind, source_ownership, capability_mode,
  verification_status, health_status, status
) values
  ('platform:native-mobility', 'Собственные предложения платформы', 'platform_native', 'platform', 'native_request', 'verified', 'healthy', 'active'),
  ('partner:localrent', 'LocalRent', 'affiliate_partner', 'partner', 'affiliate_handoff', 'verified', 'unknown', 'active'),
  ('partner:intui', 'Intui', 'affiliate_partner', 'partner', 'affiliate_handoff', 'verified', 'unknown', 'active')
on conflict (provider_key) do nothing;

insert into public.mobility_provider_markets (
  provider_id, vertical, market_id, country_code, timezone, source_currency,
  display_currency, capability_mode, readiness_status, health_status,
  public_enabled, handoff_path
)
select p.id, v.vertical, 'ar', 'AR', 'America/Argentina/Buenos_Aires', 'ARS',
       'USD', 'affiliate_handoff', 'manual_handoff', 'unknown', true, v.handoff_path
from public.mobility_providers p
join (values
  ('partner:localrent', 'rental', '/car-rental'),
  ('partner:intui', 'transfer', '/transfers')
) as v(provider_key, vertical, handoff_path) on v.provider_key = p.provider_key
on conflict (provider_id, vertical, market_id) do nothing;

create or replace function public.mobility_enqueue_review()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_entity_type text := case tg_table_name
    when 'mobility_vehicles' then 'mobility_vehicle'
    when 'mobility_rental_offers' then 'mobility_rental_offer'
    when 'mobility_transfer_services' then 'mobility_transfer_service'
  end;
begin
  if new.status = 'review' and old.status is distinct from 'review' then
    insert into public.moderation_queue (
      entity_type, entity_id, status, submitted_by, metadata
    ) values (
      v_entity_type, new.id::text, 'pending', new.owner_user_id,
      jsonb_build_object('marketId', new.market_id, 'countryCode', new.country_code)
    )
    on conflict (entity_type, entity_id) do update set
      status = 'pending',
      submitted_by = excluded.submitted_by,
      metadata = excluded.metadata,
      resolved_at = null,
      resolved_by = null,
      updated_at = now();
  end if;
  return new;
end;
$$;

revoke execute on function public.mobility_enqueue_review() from public, anon, authenticated, service_role;

create trigger mobility_vehicle_enqueue_review
after update of status on public.mobility_vehicles
for each row execute function public.mobility_enqueue_review();
create trigger mobility_rental_enqueue_review
after update of status on public.mobility_rental_offers
for each row execute function public.mobility_enqueue_review();
create trigger mobility_transfer_enqueue_review
after update of status on public.mobility_transfer_services
for each row execute function public.mobility_enqueue_review();

create or replace function public.mobility_ensure_organizer_provider(
  p_actor_user_id uuid,
  p_market_id text,
  p_country_code text,
  p_timezone text,
  p_source_currency text,
  p_display_currency text,
  p_vertical text
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  provider public.mobility_providers%rowtype;
  v_provider_key text := 'organizer:' || p_actor_user_id::text || ':' || lower(trim(p_market_id));
begin
  if p_vertical not in ('rental', 'transfer') then
    raise exception using errcode = '22023', message = 'UNKNOWN_VERTICAL';
  end if;
  insert into public.mobility_providers (
    provider_key, owner_user_id, display_name, provider_kind, source_ownership,
    capability_mode, verification_status, health_status, status
  ) values (
    v_provider_key, p_actor_user_id, 'Предложения организатора', 'organizer_native',
    'organizer', 'native_request', 'pending', 'unknown', 'active'
  )
  on conflict (provider_key) do update set updated_at = public.mobility_providers.updated_at
  returning * into provider;

  if provider.owner_user_id <> p_actor_user_id then
    raise exception using errcode = '42501', message = 'OWNER_MISMATCH';
  end if;

  insert into public.mobility_provider_markets (
    provider_id, vertical, market_id, country_code, timezone, source_currency,
    display_currency, capability_mode, readiness_status, health_status, public_enabled
  ) values (
    provider.id, p_vertical, lower(trim(p_market_id)), upper(trim(p_country_code)),
    trim(p_timezone), upper(trim(p_source_currency)), upper(trim(p_display_currency)),
    'native_request', 'requires_verification', 'unknown', false
  ) on conflict (provider_id, vertical, market_id) do nothing;

  insert into public.admin_audit_log (actor_user_id, action, entity_type, entity_id, payload)
  values (p_actor_user_id, 'mobility.provider_prepared', 'mobility_provider', provider.id::text,
    jsonb_build_object('vertical', p_vertical, 'marketId', lower(trim(p_market_id)), 'countryCode', upper(trim(p_country_code))));

  return jsonb_build_object(
    'id', provider.id, 'providerKey', provider.provider_key,
    'verificationStatus', provider.verification_status, 'capabilityMode', provider.capability_mode
  );
end;
$$;

create or replace function public.mobility_admin_verify_provider_market(
  p_actor_user_id uuid,
  p_provider_id uuid,
  p_vertical text,
  p_market_id text,
  p_expected_version bigint,
  p_approved boolean
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  provider public.mobility_providers%rowtype;
  updated_markets integer;
begin
  select * into provider from public.mobility_providers where id = p_provider_id for update;
  if provider.id is null then raise exception using errcode = 'P0002', message = 'PROVIDER_NOT_FOUND'; end if;
  if provider.row_version <> p_expected_version then raise exception using errcode = '40001', message = 'VERSION_CONFLICT'; end if;
  if provider.provider_kind = 'affiliate_partner' then raise exception using errcode = '22023', message = 'PARTNER_PROVIDER_IMMUTABLE'; end if;

  update public.mobility_providers set
    verification_status = case when p_approved then 'verified' else 'rejected' end,
    health_status = case when p_approved then 'healthy' else 'unavailable' end,
    row_version = row_version + 1,
    updated_at = now()
  where id = p_provider_id returning * into provider;

  update public.mobility_provider_markets set
    readiness_status = case when p_approved then 'verified' else 'blocked' end,
    health_status = case when p_approved then 'healthy' else 'unavailable' end,
    public_enabled = p_approved,
    updated_at = now()
  where provider_id = p_provider_id and vertical = p_vertical and market_id = lower(trim(p_market_id));
  get diagnostics updated_markets = row_count;
  if updated_markets <> 1 then
    raise exception using errcode = 'P0002', message = 'PROVIDER_MARKET_NOT_FOUND';
  end if;

  insert into public.admin_audit_log (actor_user_id, action, entity_type, entity_id, payload)
  values (p_actor_user_id, 'mobility.provider_market_verified', 'mobility_provider', p_provider_id::text,
    jsonb_build_object('vertical', p_vertical, 'marketId', lower(trim(p_market_id)), 'approved', p_approved,
      'expectedVersion', p_expected_version));
  return to_jsonb(provider) - 'owner_user_id';
end;
$$;

create or replace function public.mobility_admin_verify_vehicle(
  p_actor_user_id uuid,
  p_vehicle_id uuid,
  p_expected_version bigint,
  p_approved boolean,
  p_documents_valid_until date
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  vehicle public.mobility_vehicles%rowtype;
begin
  select * into vehicle from public.mobility_vehicles where id = p_vehicle_id for update;
  if vehicle.id is null then raise exception using errcode = 'P0002', message = 'VEHICLE_NOT_FOUND'; end if;
  if vehicle.row_version <> p_expected_version then raise exception using errcode = '40001', message = 'VERSION_CONFLICT'; end if;
  if p_approved and (p_documents_valid_until is null or p_documents_valid_until < current_date) then
    raise exception using errcode = '22023', message = 'VALID_DOCUMENT_EXPIRY_REQUIRED';
  end if;
  if p_approved and not exists (
    select 1 from public.mobility_private_documents d
    where d.vehicle_id = p_vehicle_id and d.owner_user_id = vehicle.owner_user_id
      and d.verification_status = 'verified' and d.expires_at >= p_documents_valid_until
  ) then
    raise exception using errcode = '23514', message = 'VERIFIED_PRIVATE_DOCUMENT_REQUIRED';
  end if;
  update public.mobility_vehicles set
    verification_status = case when p_approved then 'verified' else 'rejected' end,
    documents_valid_until = case when p_approved then p_documents_valid_until else null end,
    row_version = row_version + 1,
    updated_at = now()
  where id = p_vehicle_id returning * into vehicle;
  insert into public.admin_audit_log (actor_user_id, action, entity_type, entity_id, payload)
  values (p_actor_user_id, 'mobility.vehicle_verified', 'mobility_vehicle', p_vehicle_id::text,
    jsonb_build_object('approved', p_approved, 'validUntil', p_documents_valid_until,
      'expectedVersion', p_expected_version));
  return to_jsonb(vehicle) - 'documents_valid_until';
end;
$$;

create or replace function public.mobility_register_private_document(
  p_actor_user_id uuid,
  p_vehicle_id uuid,
  p_document_type text,
  p_storage_object_ref text,
  p_identifier_last4 text,
  p_expires_at date
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  document public.mobility_private_documents%rowtype;
begin
  if not exists (
    select 1 from public.mobility_vehicles v
    where v.id = p_vehicle_id and v.owner_user_id = p_actor_user_id
  ) then raise exception using errcode = '42501', message = 'VEHICLE_OWNER_MISMATCH'; end if;
  if p_expires_at is null or p_expires_at < current_date or trim(p_document_type) = ''
     or trim(p_storage_object_ref) = '' or p_storage_object_ref ~* '^https?://' then
    raise exception using errcode = '22023', message = 'INVALID_PRIVATE_DOCUMENT';
  end if;
  insert into public.mobility_private_documents (
    vehicle_id, owner_user_id, document_type, storage_object_ref,
    identifier_last4, expires_at, verification_status
  ) values (
    p_vehicle_id, p_actor_user_id, trim(p_document_type), trim(p_storage_object_ref),
    nullif(trim(p_identifier_last4), ''), p_expires_at, 'pending'
  ) returning * into document;
  insert into public.admin_audit_log (actor_user_id, action, entity_type, entity_id, payload)
  values (p_actor_user_id, 'mobility.document_registered', 'mobility_private_document', document.id::text,
    jsonb_build_object('vehicleId', p_vehicle_id, 'documentType', document.document_type, 'expiresAt', document.expires_at));
  return jsonb_build_object(
    'id', document.id, 'vehicleId', document.vehicle_id, 'documentType', document.document_type,
    'identifierLast4', document.identifier_last4, 'expiresAt', document.expires_at,
    'verificationStatus', document.verification_status
  );
end;
$$;

create or replace function public.mobility_admin_review_document(
  p_actor_user_id uuid,
  p_document_id uuid,
  p_approved boolean
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  document public.mobility_private_documents%rowtype;
begin
  select * into document from public.mobility_private_documents where id = p_document_id for update;
  if document.id is null then raise exception using errcode = 'P0002', message = 'DOCUMENT_NOT_FOUND'; end if;
  if p_approved and (document.expires_at is null or document.expires_at < current_date) then
    raise exception using errcode = '22023', message = 'DOCUMENT_EXPIRED';
  end if;
  update public.mobility_private_documents set
    verification_status = case when p_approved then 'verified' else 'rejected' end,
    verified_by = p_actor_user_id,
    verified_at = now()
  where id = p_document_id returning * into document;
  insert into public.admin_audit_log (actor_user_id, action, entity_type, entity_id, payload)
  values (p_actor_user_id, 'mobility.document_reviewed', 'mobility_private_document', document.id::text,
    jsonb_build_object('vehicleId', document.vehicle_id, 'documentType', document.document_type,
      'approved', p_approved, 'expiresAt', document.expires_at));
  return jsonb_build_object(
    'id', document.id, 'vehicleId', document.vehicle_id, 'documentType', document.document_type,
    'identifierLast4', document.identifier_last4, 'expiresAt', document.expires_at,
    'verificationStatus', document.verification_status
  );
end;
$$;

create or replace function public.mobility_create_vehicle_draft(
  p_actor_user_id uuid,
  p_provider_id uuid,
  p_fleet_id uuid,
  p_market_id text,
  p_country_code text,
  p_timezone text,
  p_public_name text,
  p_vehicle_class text,
  p_seat_capacity integer,
  p_luggage_capacity integer default 0
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  provider public.mobility_providers%rowtype;
  created public.mobility_vehicles%rowtype;
begin
  select * into provider from public.mobility_providers where id = p_provider_id for update;
  if provider.id is null or provider.provider_kind not in ('platform_native', 'organizer_native') then
    raise exception using errcode = '22023', message = 'NATIVE_PROVIDER_REQUIRED';
  end if;
  if provider.owner_user_id is not null and provider.owner_user_id <> p_actor_user_id then
    raise exception using errcode = '42501', message = 'OWNER_MISMATCH';
  end if;
  if not exists (
    select 1 from public.mobility_provider_markets pm
    where pm.provider_id = p_provider_id and pm.market_id = p_market_id
      and pm.country_code = p_country_code and pm.timezone = p_timezone
      and pm.capability_mode in ('native_request', 'native_booking')
  ) then
    raise exception using errcode = '22023', message = 'PROVIDER_MARKET_NOT_READY';
  end if;
  insert into public.mobility_vehicles (
    provider_id, fleet_id, owner_user_id, market_id, country_code, timezone,
    public_name, vehicle_class, seat_capacity, luggage_capacity
  ) values (
    p_provider_id, p_fleet_id, p_actor_user_id, lower(trim(p_market_id)), upper(trim(p_country_code)),
    trim(p_timezone), trim(p_public_name), p_vehicle_class, p_seat_capacity, p_luggage_capacity
  ) returning * into created;
  insert into public.admin_audit_log (actor_user_id, action, entity_type, entity_id, payload)
  values (p_actor_user_id, 'mobility.vehicle_created', 'mobility_vehicle', created.id::text,
    jsonb_build_object('marketId', created.market_id, 'countryCode', created.country_code));
  return to_jsonb(created) - 'documents_valid_until';
end;
$$;

create or replace function public.mobility_create_offer_draft(
  p_actor_user_id uuid,
  p_vertical text,
  p_provider_id uuid,
  p_vehicle_id uuid,
  p_market_id text,
  p_country_code text,
  p_pickup_timezone text,
  p_dropoff_timezone text,
  p_slug text,
  p_title text,
  p_origin_label text,
  p_destination_label text,
  p_source_currency text,
  p_display_currency text,
  p_rate_minor bigint,
  p_policy jsonb default '{}'
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  vehicle public.mobility_vehicles%rowtype;
  created jsonb;
begin
  select * into vehicle from public.mobility_vehicles where id = p_vehicle_id for update;
  if vehicle.id is null or vehicle.owner_user_id <> p_actor_user_id or vehicle.provider_id <> p_provider_id then
    raise exception using errcode = '42501', message = 'VEHICLE_OWNER_MISMATCH';
  end if;
  if vehicle.market_id <> lower(trim(p_market_id)) or vehicle.country_code <> upper(trim(p_country_code)) then
    raise exception using errcode = '22023', message = 'VEHICLE_MARKET_MISMATCH';
  end if;
  if not exists (
    select 1 from public.mobility_provider_markets pm
    where pm.provider_id = p_provider_id and pm.vertical = p_vertical
      and pm.market_id = lower(trim(p_market_id)) and pm.country_code = upper(trim(p_country_code))
      and pm.source_currency = upper(trim(p_source_currency))
      and pm.display_currency = upper(trim(p_display_currency))
      and pm.capability_mode in ('native_request', 'native_booking')
  ) then
    raise exception using errcode = '22023', message = 'PROVIDER_MARKET_SNAPSHOT_MISMATCH';
  end if;
  if p_vertical = 'rental' then
    insert into public.mobility_rental_offers (
      provider_id, vehicle_id, owner_user_id, market_id, country_code,
      pickup_timezone, dropoff_timezone, slug, title, pickup_public_label,
      dropoff_public_label, source_currency, display_currency, daily_rate_minor,
      deposit_minor, mileage_policy, mileage_limit_km, fuel_policy,
      insurance_summary, additional_driver_policy
    ) values (
      p_provider_id, p_vehicle_id, p_actor_user_id, lower(trim(p_market_id)), upper(trim(p_country_code)),
      trim(p_pickup_timezone), trim(p_dropoff_timezone), lower(trim(p_slug)), trim(p_title), trim(p_origin_label),
      trim(p_destination_label), upper(trim(p_source_currency)), upper(trim(p_display_currency)), p_rate_minor,
      coalesce((p_policy->>'depositMinor')::bigint, 0), coalesce(p_policy->>'mileagePolicy', 'unlimited'),
      (p_policy->>'mileageLimitKm')::integer, coalesce(p_policy->>'fuelPolicy', 'same_to_same'),
      coalesce(nullif(trim(p_policy->>'insuranceSummary'), ''), 'Условия уточняются до подтверждения'),
      coalesce(p_policy->>'additionalDriverPolicy', 'on_request')
    ) returning to_jsonb(mobility_rental_offers.*) into created;
  elsif p_vertical = 'transfer' then
    insert into public.mobility_transfer_services (
      provider_id, vehicle_id, owner_user_id, market_id, country_code,
      pickup_timezone, dropoff_timezone, slug, title, origin_public_label,
      destination_public_label, source_currency, display_currency, base_rate_minor,
      included_distance_km, extra_km_rate_minor, meeting_policy,
      flight_delay_policy, no_show_policy, confirmation_mode
    ) values (
      p_provider_id, p_vehicle_id, p_actor_user_id, lower(trim(p_market_id)), upper(trim(p_country_code)),
      trim(p_pickup_timezone), trim(p_dropoff_timezone), lower(trim(p_slug)), trim(p_title), trim(p_origin_label),
      trim(p_destination_label), upper(trim(p_source_currency)), upper(trim(p_display_currency)), p_rate_minor,
      (p_policy->>'includedDistanceKm')::integer, (p_policy->>'extraKmRateMinor')::bigint,
      coalesce(nullif(trim(p_policy->>'meetingPolicy'), ''), 'Место встречи согласуется до подтверждения'),
      coalesce(nullif(trim(p_policy->>'flightDelayPolicy'), ''), 'Задержка рейса требует подтверждения диспетчера'),
      coalesce(nullif(trim(p_policy->>'noShowPolicy'), ''), 'Условия неявки сообщаются до подтверждения'),
      coalesce(p_policy->>'confirmationMode', 'manual')
    ) returning to_jsonb(mobility_transfer_services.*) into created;
  else
    raise exception using errcode = '22023', message = 'UNKNOWN_VERTICAL';
  end if;
  insert into public.admin_audit_log (actor_user_id, action, entity_type, entity_id, payload)
  values (p_actor_user_id, 'mobility.offer_created', 'mobility_' || p_vertical,
    created->>'id', jsonb_build_object('vertical', p_vertical, 'marketId', lower(trim(p_market_id))));
  return created;
end;
$$;

create or replace function public.mobility_transition_item(
  p_actor_user_id uuid,
  p_actor_scope text,
  p_entity_type text,
  p_entity_id uuid,
  p_expected_version bigint,
  p_next_status text
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  current_status text;
  current_owner uuid;
  current_version bigint;
  next_row jsonb;
  allowed boolean := false;
begin
  if p_actor_scope not in ('organizer', 'admin') then
    raise exception using errcode = '42501', message = 'INVALID_ACTOR_SCOPE';
  end if;
  if p_entity_type = 'vehicle' then
    select status, owner_user_id, row_version into current_status, current_owner, current_version
    from public.mobility_vehicles where id = p_entity_id for update;
  elsif p_entity_type = 'rental' then
    select status, owner_user_id, row_version into current_status, current_owner, current_version
    from public.mobility_rental_offers where id = p_entity_id for update;
  elsif p_entity_type = 'transfer' then
    select status, owner_user_id, row_version into current_status, current_owner, current_version
    from public.mobility_transfer_services where id = p_entity_id for update;
  else
    raise exception using errcode = '22023', message = 'UNKNOWN_ENTITY_TYPE';
  end if;
  if current_version is null then raise exception using errcode = 'P0002', message = 'ITEM_NOT_FOUND'; end if;
  if p_actor_scope = 'organizer' and current_owner <> p_actor_user_id then
    raise exception using errcode = '42501', message = 'OWNER_MISMATCH';
  end if;
  if current_version <> p_expected_version then
    raise exception using errcode = '40001', message = 'VERSION_CONFLICT';
  end if;
  allowed := case
    when p_actor_scope = 'organizer' then
      (current_status = 'draft' and p_next_status in ('review', 'archived'))
      or (current_status = 'review' and p_next_status = 'archived')
      or (current_status = 'published' and p_next_status = 'archived')
    else
      (current_status = 'review' and p_next_status in ('draft', 'published', 'archived'))
      or (current_status = 'published' and p_next_status = 'archived')
      or (current_status = 'archived' and p_next_status = 'draft')
    end;
  if not allowed then raise exception using errcode = '22023', message = 'INVALID_STATUS_TRANSITION'; end if;

  if p_next_status = 'published' and p_entity_type in ('rental', 'transfer') and not exists (
    select 1 from public.mobility_vehicles v
    where v.id = (case when p_entity_type = 'rental'
      then (select vehicle_id from public.mobility_rental_offers where id = p_entity_id)
      else (select vehicle_id from public.mobility_transfer_services where id = p_entity_id) end)
      and v.status = 'published' and v.verification_status = 'verified'
      and v.documents_valid_until >= current_date
  ) then
    raise exception using errcode = '23514', message = 'VERIFIED_PUBLISHED_VEHICLE_REQUIRED';
  end if;
  if p_next_status = 'published' and p_entity_type in ('rental', 'transfer') and not exists (
    select 1
    from public.mobility_provider_markets pm
    where pm.provider_id = (case when p_entity_type = 'rental'
      then (select provider_id from public.mobility_rental_offers where id = p_entity_id)
      else (select provider_id from public.mobility_transfer_services where id = p_entity_id) end)
      and pm.vertical = p_entity_type
      and pm.market_id = (case when p_entity_type = 'rental'
        then (select market_id from public.mobility_rental_offers where id = p_entity_id)
        else (select market_id from public.mobility_transfer_services where id = p_entity_id) end)
      and pm.readiness_status = 'verified' and pm.health_status = 'healthy' and pm.public_enabled
  ) then
    raise exception using errcode = '23514', message = 'VERIFIED_PROVIDER_MARKET_REQUIRED';
  end if;

  if p_entity_type = 'vehicle' then
    update public.mobility_vehicles set status = p_next_status, row_version = row_version + 1, updated_at = now()
    where id = p_entity_id returning to_jsonb(mobility_vehicles.*) into next_row;
  elsif p_entity_type = 'rental' then
    update public.mobility_rental_offers set status = p_next_status, row_version = row_version + 1, updated_at = now()
    where id = p_entity_id returning to_jsonb(mobility_rental_offers.*) into next_row;
  else
    update public.mobility_transfer_services set status = p_next_status, row_version = row_version + 1, updated_at = now()
    where id = p_entity_id returning to_jsonb(mobility_transfer_services.*) into next_row;
  end if;

  update public.moderation_queue set
    status = case when p_next_status = 'published' then 'approved' when p_next_status = 'draft' then 'rejected' else status end,
    resolved_at = case when p_next_status in ('published', 'draft') then now() else resolved_at end,
    resolved_by = case when p_next_status in ('published', 'draft') then p_actor_user_id else resolved_by end,
    updated_at = now()
  where entity_type = 'mobility_' || case when p_entity_type = 'vehicle' then 'vehicle' when p_entity_type = 'rental' then 'rental_offer' else 'transfer_service' end
    and entity_id = p_entity_id::text;

  insert into public.admin_audit_log (actor_user_id, action, entity_type, entity_id, payload)
  values (p_actor_user_id, 'mobility.status_changed', 'mobility_' || p_entity_type, p_entity_id::text,
    jsonb_build_object('from', current_status, 'to', p_next_status, 'expectedVersion', p_expected_version));
  return next_row;
end;
$$;

create or replace function public.mobility_list_inventory(
  p_actor_user_id uuid,
  p_actor_scope text,
  p_vertical text default null,
  p_market_id text default null
)
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
  select jsonb_build_object(
    'providers', coalesce((select jsonb_agg(jsonb_build_object(
      'id', p.id, 'providerKey', p.provider_key, 'displayName', p.display_name,
      'verificationStatus', p.verification_status, 'healthStatus', p.health_status,
      'rowVersion', p.row_version, 'marketId', pm.market_id, 'countryCode', pm.country_code,
      'timezone', pm.timezone, 'sourceCurrency', pm.source_currency,
      'displayCurrency', pm.display_currency, 'vertical', pm.vertical,
      'readinessStatus', pm.readiness_status, 'publicEnabled', pm.public_enabled
    ) order by p.updated_at desc)
      from public.mobility_providers p
      join public.mobility_provider_markets pm on pm.provider_id = p.id
      where (p_actor_scope = 'admin' or p.owner_user_id = p_actor_user_id)
        and (p_vertical is null or pm.vertical = p_vertical)
        and (p_market_id is null or pm.market_id = p_market_id)), '[]'::jsonb),
    'documents', coalesce((select jsonb_agg(jsonb_build_object(
      'id', d.id, 'vehicleId', d.vehicle_id, 'documentType', d.document_type,
      'identifierLast4', d.identifier_last4, 'expiresAt', d.expires_at,
      'verificationStatus', d.verification_status
    ) order by d.created_at desc)
      from public.mobility_private_documents d
      where p_actor_scope = 'admin' or d.owner_user_id = p_actor_user_id), '[]'::jsonb),
    'vehicles', coalesce((select jsonb_agg(to_jsonb(v) - 'documents_valid_until' order by v.updated_at desc)
      from public.mobility_vehicles v
      where (p_actor_scope = 'admin' or v.owner_user_id = p_actor_user_id)
        and (p_market_id is null or v.market_id = p_market_id)), '[]'::jsonb),
    'rentalOffers', coalesce((select jsonb_agg(to_jsonb(r) - 'pickup_location_id' - 'dropoff_location_id' order by r.updated_at desc)
      from public.mobility_rental_offers r
      where (p_actor_scope = 'admin' or r.owner_user_id = p_actor_user_id)
        and (p_vertical is null or p_vertical = 'rental') and (p_market_id is null or r.market_id = p_market_id)), '[]'::jsonb),
    'transferServices', coalesce((select jsonb_agg(to_jsonb(t) - 'origin_location_id' - 'destination_location_id' order by t.updated_at desc)
      from public.mobility_transfer_services t
      where (p_actor_scope = 'admin' or t.owner_user_id = p_actor_user_id)
        and (p_vertical is null or p_vertical = 'transfer') and (p_market_id is null or t.market_id = p_market_id)), '[]'::jsonb)
  );
$$;

create or replace function public.mobility_get_document_storage_ref(p_document_id uuid)
returns text
language plpgsql
stable
security invoker
set search_path = pg_catalog, public
as $$
declare
  storage_ref text;
begin
  select storage_object_ref into storage_ref
  from public.mobility_private_documents
  where id = p_document_id;
  if storage_ref is null then raise exception using errcode = 'P0002', message = 'DOCUMENT_NOT_FOUND'; end if;
  return storage_ref;
end;
$$;

create or replace function public.mobility_list_requests(
  p_actor_user_id uuid,
  p_actor_scope text,
  p_vertical text default null,
  p_status text default null
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = pg_catalog, public
as $$
begin
  if p_actor_scope not in ('organizer', 'admin') then
    raise exception using errcode = '42501', message = 'ACTOR_SCOPE_FORBIDDEN';
  end if;
  if p_vertical is not null and p_vertical not in ('rental', 'transfer') then
    raise exception using errcode = '22023', message = 'UNKNOWN_VERTICAL';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', r.id,
      'vertical', r.vertical,
      'productId', r.product_id,
      'marketId', r.market_id,
      'countryCode', r.country_code,
      'timezone', r.timezone,
      'displayCurrency', r.display_currency,
      'quotedPriceMinor', r.quoted_price_minor,
      'status', r.status,
      'rowVersion', r.row_version,
      'createdAt', r.created_at,
      'contactName', rp.contact_name,
      'contactEmail', rp.contact_email,
      'contactPhone', rp.contact_phone,
      'pickupDetails', rp.pickup_details,
      'customerNote', rp.customer_note,
      'providerName', p.display_name,
      'productTitle', case when r.vertical = 'rental' then ro.title else ts.title end,
      'allocation', case when a.id is null then null else jsonb_build_object(
        'id', a.id,
        'vehicleId', a.vehicle_id,
        'startsAt', lower(a.allocation_interval),
        'endsAt', upper(a.allocation_interval),
        'status', a.status
      ) end
    ) order by r.created_at desc)
    from public.mobility_requests r
    join public.mobility_request_private rp on rp.request_id = r.id
    join public.mobility_providers p on p.id = r.provider_id
    left join public.mobility_rental_offers ro on r.vertical = 'rental' and ro.id = r.product_id
    left join public.mobility_transfer_services ts on r.vertical = 'transfer' and ts.id = r.product_id
    left join lateral (
      select va.* from public.mobility_vehicle_allocations va
      where va.request_id = r.id and va.status in ('tentative', 'confirmed', 'blocked')
      order by va.created_at desc limit 1
    ) a on true
    where (p_actor_scope = 'admin' or p.owner_user_id = p_actor_user_id)
      and (p_vertical is null or r.vertical = p_vertical)
      and (p_status is null or r.status = p_status)
  ), '[]'::jsonb);
end;
$$;

create or replace function public.mobility_transition_request(
  p_actor_user_id uuid,
  p_actor_scope text,
  p_request_id uuid,
  p_expected_version bigint,
  p_next_status text,
  p_vehicle_id uuid default null,
  p_starts_at timestamptz default null,
  p_ends_at timestamptz default null,
  p_operation_id uuid default gen_random_uuid()
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  request_row public.mobility_requests%rowtype;
  provider_owner uuid;
  vehicle_row public.mobility_vehicles%rowtype;
  allowed boolean := false;
  previous_status text;
begin
  if p_actor_scope not in ('organizer', 'admin') then
    raise exception using errcode = '42501', message = 'ACTOR_SCOPE_FORBIDDEN';
  end if;
  select r.* into request_row
  from public.mobility_requests r
  where r.id = p_request_id
  for update;
  if request_row.id is null then raise exception using errcode = 'P0002', message = 'REQUEST_NOT_FOUND'; end if;
  select owner_user_id into provider_owner
  from public.mobility_providers
  where id = request_row.provider_id;
  if p_actor_scope = 'organizer' and provider_owner <> p_actor_user_id then
    raise exception using errcode = '42501', message = 'OWNER_MISMATCH';
  end if;
  if request_row.row_version <> p_expected_version then
    raise exception using errcode = '40001', message = 'VERSION_CONFLICT';
  end if;
  previous_status := request_row.status;

  allowed :=
    (request_row.status = 'submitted' and p_next_status in ('in_review', 'rejected', 'cancelled'))
    or (request_row.status = 'in_review' and p_next_status in ('confirmed', 'rejected', 'cancelled'))
    or (request_row.status = 'confirmed' and p_next_status in ('completed', 'no_show', 'cancelled'));
  if not allowed then raise exception using errcode = '22023', message = 'INVALID_REQUEST_TRANSITION'; end if;

  if p_next_status = 'confirmed' then
    if p_vehicle_id is null or p_starts_at is null or p_ends_at is null or p_ends_at <= p_starts_at then
      raise exception using errcode = '22023', message = 'ALLOCATION_REQUIRED';
    end if;
    select * into vehicle_row from public.mobility_vehicles where id = p_vehicle_id for update;
    if vehicle_row.id is null then raise exception using errcode = 'P0002', message = 'VEHICLE_NOT_FOUND'; end if;
    if vehicle_row.provider_id <> request_row.provider_id or vehicle_row.status <> 'published'
      or vehicle_row.verification_status <> 'verified' or vehicle_row.documents_valid_until < current_date then
      raise exception using errcode = '23514', message = 'VEHICLE_NOT_ASSIGNABLE';
    end if;
    if p_actor_scope = 'organizer' and vehicle_row.owner_user_id <> p_actor_user_id then
      raise exception using errcode = '42501', message = 'OWNER_MISMATCH';
    end if;
    insert into public.mobility_vehicle_allocations(
      vehicle_id, request_id, owner_user_id, vertical, product_id, allocation_interval, status
    ) values (
      p_vehicle_id, request_row.id, vehicle_row.owner_user_id, request_row.vertical,
      request_row.product_id, tstzrange(p_starts_at, p_ends_at, '[)'), 'confirmed'
    );
  elsif request_row.status = 'confirmed' and p_next_status = 'cancelled' then
    update public.mobility_vehicle_allocations
    set status = 'cancelled', updated_at = now()
    where request_id = request_row.id and status in ('tentative', 'confirmed');
  end if;

  update public.mobility_requests
  set status = p_next_status, row_version = row_version + 1, updated_at = now()
  where id = request_row.id
  returning * into request_row;

  insert into public.mobility_analytics_events(
    event_name, operation_id, provider_id, vertical, market_id, product_id, outcome, placement
  ) values (
    'mobility_transition', p_operation_id, request_row.provider_id, request_row.vertical,
    request_row.market_id, request_row.product_id,
    p_next_status,
    'operations:request_inbox'
  ) on conflict (event_name, operation_id) do nothing;

  insert into public.admin_audit_log(actor_user_id, action, entity_type, entity_id, payload)
  values (
    p_actor_user_id, 'mobility.request_status_changed', 'mobility_request', request_row.id::text,
    jsonb_build_object('from', previous_status, 'to', p_next_status, 'expectedVersion', p_expected_version,
      'vehicleAssigned', p_vehicle_id is not null, 'operationId', p_operation_id)
  );

  insert into public.admin_notifications(type, title, body, href, metadata)
  values (
    'booking_updated',
    'Статус заявки на поездку изменён',
    'Заявка переведена в новый операционный статус.',
    '/admin/marketplace/mobility',
    jsonb_build_object('entity_type', 'mobility_request_transition', 'entity_id', p_operation_id,
      'request_id', request_row.id, 'status', p_next_status)
  ) on conflict do nothing;

  return jsonb_build_object(
    'id', request_row.id,
    'status', request_row.status,
    'rowVersion', request_row.row_version
  );
exception
  when exclusion_violation or unique_violation then
    raise exception using errcode = '23514', message = 'VEHICLE_TIME_CONFLICT';
end;
$$;

create or replace function public.mobility_public_catalog(
  p_vertical text,
  p_market_id text
)
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
  select jsonb_build_object(
    'providers', coalesce((select jsonb_agg(jsonb_build_object(
      'providerId', p.id, 'providerKey', p.provider_key, 'displayName', p.display_name,
      'vertical', pm.vertical,
      'sourceOwnership', p.source_ownership, 'capabilityMode', pm.capability_mode,
      'healthStatus', pm.health_status, 'readinessStatus', pm.readiness_status,
      'marketId', pm.market_id, 'countryCode', pm.country_code,
      'sourceCurrency', pm.source_currency, 'displayCurrency', pm.display_currency,
      'timezone', pm.timezone, 'handoffPath', pm.handoff_path
    ) order by p.display_name)
      from public.mobility_provider_markets pm join public.mobility_providers p on p.id = pm.provider_id
      where pm.vertical = p_vertical and pm.market_id = p_market_id and pm.public_enabled
        and p.status = 'active' and pm.capability_mode in ('native_request', 'affiliate_handoff')), '[]'::jsonb),
    'offers', case when p_vertical = 'rental' then coalesce((select jsonb_agg(jsonb_build_object(
      'id', r.id, 'providerId', r.provider_id, 'vertical', 'rental', 'slug', r.slug,
      'title', r.title, 'originLabel', r.pickup_public_label, 'destinationLabel', r.dropoff_public_label,
      'sourceCurrency', r.source_currency, 'displayCurrency', r.display_currency,
      'priceMinor', r.daily_rate_minor, 'depositMinor', r.deposit_minor,
      'insuranceSummary', r.insurance_summary, 'capabilityMode', r.capability_mode,
      'confirmationMode', 'manual', 'marketId', r.market_id, 'countryCode', r.country_code,
      'timezone', r.pickup_timezone, 'seatCapacity', v.seat_capacity, 'luggageCapacity', v.luggage_capacity
    ) order by r.updated_at desc)
      from public.mobility_rental_offers r join public.mobility_vehicles v on v.id = r.vehicle_id
      where r.market_id = p_market_id and r.status = 'published' and r.capability_mode = 'native_request'
        and v.status = 'published' and v.verification_status = 'verified'
        and v.documents_valid_until >= current_date), '[]'::jsonb)
    else coalesce((select jsonb_agg(jsonb_build_object(
      'id', t.id, 'providerId', t.provider_id, 'vertical', 'transfer', 'slug', t.slug,
      'title', t.title, 'originLabel', t.origin_public_label, 'destinationLabel', t.destination_public_label,
      'sourceCurrency', t.source_currency, 'displayCurrency', t.display_currency,
      'priceMinor', t.base_rate_minor, 'meetingPolicy', t.meeting_policy,
      'flightDelayPolicy', t.flight_delay_policy, 'noShowPolicy', t.no_show_policy,
      'capabilityMode', t.capability_mode, 'confirmationMode', t.confirmation_mode,
      'marketId', t.market_id, 'countryCode', t.country_code, 'timezone', t.pickup_timezone,
      'seatCapacity', v.seat_capacity, 'luggageCapacity', v.luggage_capacity
    ) order by t.updated_at desc)
      from public.mobility_transfer_services t join public.mobility_vehicles v on v.id = t.vehicle_id
      where t.market_id = p_market_id and t.status = 'published' and t.capability_mode = 'native_request'
        and v.status = 'published' and v.verification_status = 'verified'
        and v.documents_valid_until >= current_date), '[]'::jsonb) end
  );
$$;

create or replace function public.mobility_create_request(
  p_provider_id uuid,
  p_vertical text,
  p_product_id uuid,
  p_idempotency_key text,
  p_requester_user_id uuid,
  p_contact_name text,
  p_contact_email text,
  p_contact_phone text default null,
  p_pickup_details jsonb default '{}',
  p_customer_note text default null,
  p_operation_id uuid default gen_random_uuid(),
  p_placement text default 'mobility_catalog'
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public, extensions
as $$
declare
  offer jsonb;
  request_row public.mobility_requests%rowtype;
  existing_row public.mobility_requests%rowtype;
  key_hash text := encode(digest(p_idempotency_key, 'sha256'), 'hex');
  request_fingerprint text;
begin
  if length(p_idempotency_key) < 16 or length(p_idempotency_key) > 200 then
    raise exception using errcode = '22023', message = 'INVALID_IDEMPOTENCY_KEY';
  end if;
  if p_vertical = 'rental' then
    select jsonb_build_object('providerId', provider_id, 'marketId', market_id, 'countryCode', country_code,
      'timezone', pickup_timezone, 'sourceCurrency', source_currency, 'displayCurrency', display_currency,
      'priceMinor', daily_rate_minor, 'capabilityMode', capability_mode)
    into offer from public.mobility_rental_offers where id = p_product_id and status = 'published';
  elsif p_vertical = 'transfer' then
    select jsonb_build_object('providerId', provider_id, 'marketId', market_id, 'countryCode', country_code,
      'timezone', pickup_timezone, 'sourceCurrency', source_currency, 'displayCurrency', display_currency,
      'priceMinor', base_rate_minor, 'capabilityMode', capability_mode)
    into offer from public.mobility_transfer_services where id = p_product_id and status = 'published';
  else
    raise exception using errcode = '22023', message = 'UNKNOWN_VERTICAL';
  end if;
  if offer is null or offer->>'capabilityMode' <> 'native_request' or (offer->>'providerId')::uuid <> p_provider_id then
    raise exception using errcode = '22023', message = 'NATIVE_REQUEST_UNAVAILABLE';
  end if;

  request_fingerprint := encode(digest(jsonb_build_object(
    'providerId', p_provider_id,
    'vertical', p_vertical,
    'productId', p_product_id,
    'requesterUserId', p_requester_user_id,
    'contactName', trim(p_contact_name),
    'contactEmail', lower(trim(p_contact_email)),
    'contactPhone', nullif(trim(p_contact_phone), ''),
    'pickupDetails', coalesce(p_pickup_details, '{}'::jsonb),
    'customerNote', nullif(trim(p_customer_note), '')
  )::text, 'sha256'), 'hex');

  insert into public.mobility_requests (
    provider_id, requester_user_id, vertical, product_id, market_id, country_code,
    timezone, source_currency, display_currency, quoted_price_minor,
    idempotency_key_hash, request_fingerprint
  ) values (
    p_provider_id, p_requester_user_id, p_vertical, p_product_id, offer->>'marketId', offer->>'countryCode',
    offer->>'timezone', offer->>'sourceCurrency', offer->>'displayCurrency', (offer->>'priceMinor')::bigint,
    key_hash, request_fingerprint
  )
  on conflict (provider_id, idempotency_key_hash) do nothing
  returning * into request_row;

  if not found then
    select * into existing_row
    from public.mobility_requests
    where provider_id = p_provider_id and idempotency_key_hash = key_hash;
    if existing_row.request_fingerprint <> request_fingerprint then
      raise exception using errcode = '23505', message = 'MOBILITY_IDEMPOTENCY_CONFLICT';
    end if;
    return jsonb_build_object(
      'id', existing_row.id, 'status', existing_row.status, 'vertical', existing_row.vertical,
      'marketId', existing_row.market_id, 'displayCurrency', existing_row.display_currency,
      'quotedPriceMinor', existing_row.quoted_price_minor, 'confirmationMode', 'manual'
    );
  end if;

  insert into public.mobility_request_private (
    request_id, contact_name, contact_email, contact_phone, pickup_details, customer_note
  ) values (
    request_row.id, trim(p_contact_name), lower(trim(p_contact_email)), nullif(trim(p_contact_phone), ''),
    p_pickup_details, nullif(trim(p_customer_note), '')
  ) on conflict (request_id) do nothing;

  insert into public.mobility_analytics_events (
    event_name, operation_id, provider_id, vertical, market_id, product_id, outcome, placement
  ) values (
    'mobility_transition', p_operation_id, p_provider_id, p_vertical,
    offer->>'marketId', p_product_id, 'native_request_created', p_placement
  ) on conflict (event_name, operation_id) do nothing;

  insert into public.admin_notifications(type, title, body, href, metadata)
  values (
    'new_lead',
    case when p_vertical = 'rental' then 'Новая заявка на автомобиль' else 'Новая заявка на трансфер' end,
    'Новая заявка ожидает проверки и подтверждения.',
    '/admin/marketplace/mobility',
    jsonb_build_object('entity_type', 'mobility_request', 'entity_id', request_row.id)
  ) on conflict do nothing;

  return jsonb_build_object(
    'id', request_row.id, 'status', request_row.status, 'vertical', request_row.vertical,
    'marketId', request_row.market_id, 'displayCurrency', request_row.display_currency,
    'quotedPriceMinor', request_row.quoted_price_minor, 'confirmationMode', 'manual'
  );
end;
$$;

create or replace function public.mobility_record_partner_handoff(
  p_provider_id uuid,
  p_vertical text,
  p_market_id text,
  p_operation_id uuid,
  p_placement text
)
returns void
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if not exists (
    select 1 from public.mobility_provider_markets pm
    where pm.provider_id = p_provider_id and pm.vertical = p_vertical and pm.market_id = p_market_id
      and pm.capability_mode = 'affiliate_handoff' and pm.public_enabled
  ) then raise exception using errcode = '22023', message = 'PARTNER_HANDOFF_UNAVAILABLE'; end if;
  insert into public.mobility_analytics_events (
    event_name, operation_id, provider_id, vertical, market_id, outcome, placement
  ) values (
    'mobility_transition', p_operation_id, p_provider_id, p_vertical, p_market_id,
    'affiliate_handoff', p_placement
  ) on conflict (event_name, operation_id) do nothing;
end;
$$;

do $$
declare
  signature regprocedure;
begin
  foreach signature in array array[
    'public.mobility_ensure_organizer_provider(uuid,text,text,text,text,text,text)'::regprocedure,
    'public.mobility_admin_verify_provider_market(uuid,uuid,text,text,bigint,boolean)'::regprocedure,
    'public.mobility_admin_verify_vehicle(uuid,uuid,bigint,boolean,date)'::regprocedure,
    'public.mobility_register_private_document(uuid,uuid,text,text,text,date)'::regprocedure,
    'public.mobility_admin_review_document(uuid,uuid,boolean)'::regprocedure,
    'public.mobility_create_vehicle_draft(uuid,uuid,uuid,text,text,text,text,text,integer,integer)'::regprocedure,
    'public.mobility_create_offer_draft(uuid,text,uuid,uuid,text,text,text,text,text,text,text,text,text,text,bigint,jsonb)'::regprocedure,
    'public.mobility_transition_item(uuid,text,text,uuid,bigint,text)'::regprocedure,
    'public.mobility_list_inventory(uuid,text,text,text)'::regprocedure,
    'public.mobility_get_document_storage_ref(uuid)'::regprocedure,
    'public.mobility_list_requests(uuid,text,text,text)'::regprocedure,
    'public.mobility_transition_request(uuid,text,uuid,bigint,text,uuid,timestamp with time zone,timestamp with time zone,uuid)'::regprocedure,
    'public.mobility_public_catalog(text,text)'::regprocedure,
    'public.mobility_create_request(uuid,text,uuid,text,uuid,text,text,text,jsonb,text,uuid,text)'::regprocedure,
    'public.mobility_record_partner_handoff(uuid,text,text,uuid,text)'::regprocedure
  ] loop
    execute format('revoke execute on function %s from public, anon, authenticated', signature);
    execute format('grant execute on function %s to service_role', signature);
  end loop;
end $$;

comment on table public.mobility_private_documents is 'Private compliance metadata; never expose through public catalog or analytics.';
comment on table public.mobility_private_locations is 'Exact pickup/drop-off addresses; public APIs expose only coarse labels.';
comment on table public.mobility_analytics_events is 'PII-free mobility outcomes for native request versus affiliate handoff analytics.';
