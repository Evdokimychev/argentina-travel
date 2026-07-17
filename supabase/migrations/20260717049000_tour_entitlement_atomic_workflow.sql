-- Atomic organizer tour/excursion workflow with commercial enforcement.
-- The service role invokes this function only after a personal organizer
-- session has been verified by the server route. Ownership, roles and every
-- commercial decision are rechecked in the same database transaction.

alter table public.tours
  add column if not exists market_code text not null default 'ar',
  add column if not exists row_version integer not null default 1;

alter table public.tours drop constraint if exists tours_market_code_check;
alter table public.tours add constraint tours_market_code_check
  check (market_code ~ '^[a-z][a-z0-9_-]{1,31}$');

alter table public.tours drop constraint if exists tours_row_version_check;
alter table public.tours add constraint tours_row_version_check
  check (row_version > 0);

create index if not exists tours_owner_market_status_idx
  on public.tours (owner_user_id, market_code, status);

create or replace function private.organizer_active_offer_usage(p_organizer_user_id uuid)
returns bigint
language sql
stable
security invoker
set search_path = ''
as $$
  select
    (select count(*) from public.tours tour
      where tour.owner_user_id = p_organizer_user_id::text and tour.status = 'published')
    + (select count(*) from public.apartment_listings apartment
      where apartment.owner_user_id = p_organizer_user_id and apartment.status = 'published')
    + (select count(*) from public.mobility_rental_offers rental
      where rental.owner_user_id = p_organizer_user_id and rental.status = 'published')
    + (select count(*) from public.mobility_transfer_services transfer
      where transfer.owner_user_id = p_organizer_user_id and transfer.status = 'published')
$$;

revoke all on function private.organizer_active_offer_usage(uuid)
  from public, anon, authenticated, service_role;

create or replace function private.organizer_active_offer_limit(
  p_organizer_user_id uuid,
  p_at timestamptz default statement_timestamp()
)
returns table(enabled boolean, limit_value bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  with selected_plan as (
    select subscription.plan_id as id
    from public.organizer_commercial_subscriptions subscription
    join public.commercial_plans plan on plan.id = subscription.plan_id
    where subscription.organizer_user_id = p_organizer_user_id
      and subscription.status = 'active'
      and subscription.starts_at <= p_at
      and (subscription.ends_at is null or subscription.ends_at > p_at)
      and plan.status in ('active', 'retired')
    limit 1
  ), effective_plan as (
    select id from selected_plan
    union all
    select plan.id from public.commercial_plans plan
    where plan.status = 'active' and plan.is_default = true
      and not exists (select 1 from selected_plan)
    limit 1
  )
  select
    coalesce(override.enabled, grant_row.enabled, definition.default_enabled, false),
    coalesce(override.limit_value, grant_row.limit_value, definition.default_limit, 0)
  from public.commercial_entitlement_definitions definition
  cross join effective_plan plan
  left join public.commercial_plan_entitlements grant_row
    on grant_row.plan_id = plan.id and grant_row.entitlement_key = definition.key
  left join public.organizer_entitlement_overrides override
    on override.organizer_user_id = p_organizer_user_id
    and override.entitlement_key = definition.key
    and override.starts_at <= p_at
    and (override.ends_at is null or override.ends_at > p_at)
  where definition.key = 'limits.active_offers' and definition.is_active = true
$$;

revoke all on function private.organizer_active_offer_limit(uuid, timestamptz)
  from public, anon, authenticated, service_role;

create or replace function private.enforce_shared_active_offer_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_enabled boolean;
  v_limit bigint;
  v_usage bigint;
begin
  if new.status <> 'published'
    or (tg_op = 'UPDATE' and old.status = 'published')
  then
    return new;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('organizer-commercial:' || new.owner_user_id::text, 0)
  );
  select decision.enabled, decision.limit_value
  into v_enabled, v_limit
  from private.organizer_active_offer_limit(new.owner_user_id) decision;

  if not coalesce(v_enabled, false) then
    raise exception using errcode = '42501', message = 'ACTIVE_OFFER_LIMIT_DISABLED';
  end if;
  v_usage := private.organizer_active_offer_usage(new.owner_user_id);
  if v_usage >= v_limit then
    raise exception using errcode = 'P0001', message = 'ACTIVE_OFFER_LIMIT_REACHED';
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_shared_active_offer_limit()
  from public, anon, authenticated, service_role;

drop trigger if exists apartment_shared_active_offer_limit on public.apartment_listings;
create trigger apartment_shared_active_offer_limit
  before insert or update on public.apartment_listings
  for each row execute function private.enforce_shared_active_offer_limit();

drop trigger if exists mobility_rental_shared_active_offer_limit on public.mobility_rental_offers;
create trigger mobility_rental_shared_active_offer_limit
  before insert or update on public.mobility_rental_offers
  for each row execute function private.enforce_shared_active_offer_limit();

drop trigger if exists mobility_transfer_shared_active_offer_limit on public.mobility_transfer_services;
create trigger mobility_transfer_shared_active_offer_limit
  before insert or update on public.mobility_transfer_services
  for each row execute function private.enforce_shared_active_offer_limit();

create or replace function public.organizer_mutate_tour_atomic(
  p_tour_id text,
  p_actor_user_id uuid,
  p_expected_version integer,
  p_operation text,
  p_market_code text,
  p_product_type text,
  p_slug text,
  p_title text,
  p_listing jsonb,
  p_payload jsonb,
  p_editor_draft jsonb,
  p_ip_address text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing public.tours%rowtype;
  v_next public.tours%rowtype;
  v_plan_id uuid;
  v_module_key text;
  v_market_key text;
  v_module_enabled boolean := false;
  v_market_enabled boolean := false;
  v_limit_enabled boolean := false;
  v_active_limit bigint := 0;
  v_active_usage bigint := 0;
  v_now timestamptz := statement_timestamp();
begin
  if p_actor_user_id is null or not exists (
    select 1
    from public.profiles profile
    where profile.id = p_actor_user_id
      and profile.roles @> array['organizer']::text[]
      and not coalesce(profile.is_blocked, false)
  ) then
    raise exception using errcode = '42501', message = 'TOUR_ACTOR_FORBIDDEN';
  end if;

  if p_tour_id is null or btrim(p_tour_id) = ''
    or p_expected_version is null or p_expected_version < 0
    or p_operation not in ('save', 'submit', 'archive')
    or p_product_type not in ('tour', 'excursion')
    or p_market_code is null or p_market_code !~ '^[a-z][a-z0-9_-]{1,31}$'
    or p_slug is null or p_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    or p_title is null or char_length(btrim(p_title)) not between 1 and 120
    or p_listing is null or jsonb_typeof(p_listing) <> 'object'
    or p_payload is null or jsonb_typeof(p_payload) <> 'object'
    or p_editor_draft is null or jsonb_typeof(p_editor_draft) <> 'object'
  then
    raise exception using errcode = '22023', message = 'TOUR_INPUT_INVALID';
  end if;

  -- One organizer cannot race two publications past the shared offer limit.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('organizer-commercial:' || p_actor_user_id::text, 0)
  );

  select * into v_existing
  from public.tours
  where id = p_tour_id
  for update;

  if found then
    if v_existing.owner_user_id <> p_actor_user_id::text then
      raise exception using errcode = '42501', message = 'TOUR_OWNER_FORBIDDEN';
    end if;
    if v_existing.product_type <> p_product_type then
      raise exception using errcode = '22023', message = 'TOUR_PRODUCT_TYPE_IMMUTABLE';
    end if;
    if v_existing.row_version <> p_expected_version then
      raise exception using errcode = '40001', message = 'TOUR_VERSION_CONFLICT';
    end if;
  elsif p_expected_version <> 0 or p_operation <> 'save' then
    raise exception using errcode = '40001', message = 'TOUR_VERSION_CONFLICT';
  end if;

  -- Archiving is always allowed for an owner: a downgraded plan must never
  -- trap a public offer. Saving and submitting require the product module.
  if p_operation <> 'archive' then
    v_module_key := case p_product_type
      when 'excursion' then 'module.excursions.manage'
      else 'module.tours.manage'
    end;

    select subscription.plan_id into v_plan_id
    from public.organizer_commercial_subscriptions subscription
    join public.commercial_plans plan on plan.id = subscription.plan_id
    where subscription.organizer_user_id = p_actor_user_id
      and subscription.status = 'active'
      and subscription.starts_at <= v_now
      and (subscription.ends_at is null or subscription.ends_at > v_now)
      and plan.status in ('active', 'retired')
    limit 1
    for share of subscription, plan;

    if v_plan_id is null then
      select plan.id into v_plan_id
      from public.commercial_plans plan
      where plan.status = 'active' and plan.is_default = true
      limit 1
      for share;
    end if;

    if v_plan_id is null then
      raise exception using errcode = '42501', message = 'TOUR_COMMERCIAL_CONTRACT_UNAVAILABLE';
    end if;

    -- Lock the commercial rows used by this decision so a concurrent plan or
    -- override change cannot produce a half-old, half-new authorization.
    perform 1 from public.commercial_entitlement_definitions
      where key in (v_module_key, 'market.' || p_market_code || '.publish', 'limits.active_offers')
      for share;
    perform 1 from public.commercial_plan_entitlements
      where plan_id = v_plan_id
        and entitlement_key in (v_module_key, 'market.' || p_market_code || '.publish', 'limits.active_offers')
      for share;
    perform 1 from public.organizer_entitlement_overrides
      where organizer_user_id = p_actor_user_id
        and entitlement_key in (v_module_key, 'market.' || p_market_code || '.publish', 'limits.active_offers')
      for share;

    select coalesce(override.enabled, grant_row.enabled, definition.default_enabled, false)
      into v_module_enabled
    from public.commercial_entitlement_definitions definition
    left join public.commercial_plan_entitlements grant_row
      on grant_row.plan_id = v_plan_id and grant_row.entitlement_key = definition.key
    left join public.organizer_entitlement_overrides override
      on override.organizer_user_id = p_actor_user_id
      and override.entitlement_key = definition.key
      and override.starts_at <= v_now
      and (override.ends_at is null or override.ends_at > v_now)
    left join public.commercial_adapters adapter on adapter.id = definition.adapter_id
    where definition.key = v_module_key
      and definition.is_active = true
      and (adapter.id is null or adapter.status = 'active');

    if not coalesce(v_module_enabled, false) then
      raise exception using errcode = '42501', message = 'TOUR_MODULE_NOT_ENTITLED';
    end if;
  end if;

  if p_operation = 'submit' then
    v_market_key := 'market.' || p_market_code || '.publish';

    select coalesce(override.enabled, grant_row.enabled, definition.default_enabled, false)
      into v_market_enabled
    from public.commercial_entitlement_definitions definition
    left join public.commercial_plan_entitlements grant_row
      on grant_row.plan_id = v_plan_id and grant_row.entitlement_key = definition.key
    left join public.organizer_entitlement_overrides override
      on override.organizer_user_id = p_actor_user_id
      and override.entitlement_key = definition.key
      and override.starts_at <= v_now
      and (override.ends_at is null or override.ends_at > v_now)
    left join public.commercial_adapters adapter on adapter.id = definition.adapter_id
    where definition.key = v_market_key
      and definition.is_active = true
      and (adapter.id is null or adapter.status = 'active');

    if not coalesce(v_market_enabled, false) then
      raise exception using errcode = '42501', message = 'TOUR_MARKET_NOT_ENTITLED';
    end if;

    select
      coalesce(override.enabled, grant_row.enabled, definition.default_enabled, false),
      coalesce(override.limit_value, grant_row.limit_value, definition.default_limit, 0)
    into v_limit_enabled, v_active_limit
    from public.commercial_entitlement_definitions definition
    left join public.commercial_plan_entitlements grant_row
      on grant_row.plan_id = v_plan_id and grant_row.entitlement_key = definition.key
    left join public.organizer_entitlement_overrides override
      on override.organizer_user_id = p_actor_user_id
      and override.entitlement_key = definition.key
      and override.starts_at <= v_now
      and (override.ends_at is null or override.ends_at > v_now)
    where definition.key = 'limits.active_offers' and definition.is_active = true;

    if not coalesce(v_limit_enabled, false) then
      raise exception using errcode = '42501', message = 'TOUR_ACTIVE_OFFER_LIMIT_DISABLED';
    end if;

    -- Re-submission of the same already-public offer does not consume another
    -- slot. New and archived offers share one limit with every native module.
    if v_existing.id is null or v_existing.status <> 'published' then
      v_active_usage := private.organizer_active_offer_usage(p_actor_user_id);

      if v_active_usage >= v_active_limit then
        raise exception using errcode = 'P0001', message = 'TOUR_ACTIVE_OFFER_LIMIT_REACHED';
      end if;
    end if;
  end if;

  begin
    if v_existing.id is null then
      insert into public.tours (
        id, market_code, slug, owner_user_id, status, title, listing, payload,
        product_type, editor_draft, published_at, moderation_status, row_version
      ) values (
        p_tour_id, p_market_code, p_slug, p_actor_user_id::text, 'draft', btrim(p_title),
        p_listing, p_payload, p_product_type, p_editor_draft, null, 'none', 1
      ) returning * into v_next;
    else
      update public.tours set
        market_code = p_market_code,
        slug = p_slug,
        title = btrim(p_title),
        listing = p_listing,
        payload = p_payload,
        editor_draft = p_editor_draft,
        status = case p_operation when 'submit' then 'published' when 'archive' then 'archived' else 'draft' end,
        published_at = case when p_operation = 'submit' then coalesce(published_at, v_now) else published_at end,
        moderation_status = case when p_operation = 'submit' then 'pending' else 'none' end,
        moderation_notes = case when p_operation = 'submit' then null else moderation_notes end,
        moderated_by = case when p_operation = 'submit' then null else moderated_by end,
        moderated_at = case when p_operation = 'submit' then null else moderated_at end,
        row_version = row_version + 1
      where id = p_tour_id and row_version = p_expected_version
      returning * into v_next;

      if not found then
        raise exception using errcode = '40001', message = 'TOUR_VERSION_CONFLICT';
      end if;
    end if;
  exception when unique_violation then
    raise exception using errcode = '23505', message = 'TOUR_SLUG_CONFLICT';
  end;

  if p_operation in ('save', 'archive') then
    update public.moderation_queue
    set status = 'cancelled', resolved_at = v_now, resolved_by = null
    where entity_type = 'tour' and entity_id = p_tour_id
      and status in ('pending', 'in_review');
  end if;

  insert into public.admin_audit_log (
    actor_user_id, action, entity_type, entity_id, payload, ip_address
  ) values (
    p_actor_user_id,
    'organizer.tour_' || p_operation,
    p_product_type,
    p_tour_id,
    jsonb_build_object(
      'operation', p_operation,
      'productType', p_product_type,
      'marketCode', p_market_code,
      'expectedVersion', p_expected_version,
      'nextVersion', v_next.row_version,
      'status', v_next.status,
      'moderationStatus', v_next.moderation_status
    ),
    p_ip_address
  );

  return jsonb_build_object(
    'id', v_next.id,
    'rowVersion', v_next.row_version,
    'updatedAt', v_next.updated_at,
    'status', v_next.status,
    'moderationStatus', v_next.moderation_status,
    'moderationNotes', v_next.moderation_notes
  );
end;
$$;

create or replace function public.admin_unpublish_tour_atomic(
  p_tour_id text,
  p_expected_version integer,
  p_actor_user_id uuid,
  p_action text,
  p_ip_address text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tour public.tours%rowtype;
  v_now timestamptz := statement_timestamp();
begin
  if p_actor_user_id is null or not exists (
    select 1
    from public.admin_staff staff
    join public.profiles profile on profile.id = staff.user_id
    where staff.user_id = p_actor_user_id
      and staff.is_active = true
      and profile.roles @> array['admin']::text[]
      and not coalesce(profile.is_blocked, false)
      and (staff.capabilities @> array['*']::text[]
        or staff.capabilities @> array['marketplace.moderation']::text[])
  ) then
    raise exception using errcode = '42501', message = 'TOUR_ADMIN_FORBIDDEN';
  end if;
  if p_action not in ('unpublish', 'archive') or p_expected_version < 1 then
    raise exception using errcode = '22023', message = 'TOUR_ADMIN_INPUT_INVALID';
  end if;

  select * into v_tour from public.tours where id = p_tour_id for update;
  if not found or v_tour.row_version <> p_expected_version then
    raise exception using errcode = '40001', message = 'TOUR_VERSION_CONFLICT';
  end if;

  update public.tours set
    status = case when p_action = 'archive' then 'archived' else 'draft' end,
    moderation_status = 'none',
    row_version = row_version + 1
  where id = p_tour_id and row_version = p_expected_version
  returning * into v_tour;

  update public.moderation_queue set
    status = 'cancelled', resolved_at = v_now, resolved_by = p_actor_user_id
  where entity_type = 'tour' and entity_id = p_tour_id
    and status in ('pending', 'in_review');

  insert into public.admin_audit_log(
    actor_user_id, action, entity_type, entity_id, payload, ip_address
  ) values (
    p_actor_user_id,
    'tour.' || p_action,
    v_tour.product_type,
    p_tour_id,
    jsonb_build_object(
      'expectedVersion', p_expected_version,
      'nextVersion', v_tour.row_version,
      'ownerUserId', v_tour.owner_user_id,
      'marketCode', v_tour.market_code,
      'nextStatus', v_tour.status
    ),
    p_ip_address
  );

  return jsonb_build_object(
    'id', v_tour.id,
    'rowVersion', v_tour.row_version,
    'status', v_tour.status,
    'updatedAt', v_tour.updated_at
  );
end;
$$;

revoke all on function public.organizer_mutate_tour_atomic(
  text, uuid, integer, text, text, text, text, text, jsonb, jsonb, jsonb, text
) from public, anon, authenticated;
grant execute on function public.organizer_mutate_tour_atomic(
  text, uuid, integer, text, text, text, text, text, jsonb, jsonb, jsonb, text
) to service_role;
revoke all on function public.admin_unpublish_tour_atomic(text, integer, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.admin_unpublish_tour_atomic(text, integer, uuid, text, text)
  to service_role;

comment on column public.tours.market_code is
  'Stable market capability code used by commercial publication guards';
comment on column public.tours.row_version is
  'Optimistic concurrency version shared by organizer and admin moderation workflows';
comment on function public.organizer_mutate_tour_atomic(
  text, uuid, integer, text, text, text, text, text, jsonb, jsonb, jsonb, text
) is 'Atomic owner-checked tour/excursion save, submit and archive with commercial enforcement';
comment on function public.admin_unpublish_tour_atomic(text, integer, uuid, text, text) is
  'CAS owner-console withdrawal/archive action; content editing remains in the editorial workflow';
comment on function private.organizer_active_offer_usage(uuid) is
  'Reusable cross-module active-offer usage for commercial limit enforcement';
comment on function private.organizer_active_offer_limit(uuid, timestamptz) is
  'Reusable effective active-offer limit for a commercial organizer contract';
comment on function private.enforce_shared_active_offer_limit() is
  'Serializes publication slots across apartment, rental, transfer and tour workflows';
