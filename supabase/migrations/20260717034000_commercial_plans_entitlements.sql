-- Commercial control plane for organizer plans and reusable entitlements.
-- Hotels are deliberately registered as future_disabled and cannot be enabled
-- by a plan or organizer override.

create table public.commercial_adapters (
  id uuid primary key default gen_random_uuid(),
  adapter_type text not null check (adapter_type in ('module', 'product', 'provider', 'market')),
  code text not null check (code ~ '^[a-z][a-z0-9_.-]{1,63}$'),
  label text not null check (char_length(label) between 2 and 120),
  description text,
  status text not null default 'active' check (status in ('active', 'future_disabled', 'retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (adapter_type, code)
);

create table public.commercial_entitlement_definitions (
  key text primary key check (key ~ '^[a-z][a-z0-9_.-]{2,119}$'),
  label text not null check (char_length(label) between 2 and 160),
  description text,
  value_type text not null default 'boolean' check (value_type in ('boolean', 'limit')),
  adapter_id uuid references public.commercial_adapters (id) on delete restrict,
  is_active boolean not null default true,
  default_enabled boolean not null default false,
  default_limit bigint check (default_limit is null or default_limit >= 0),
  hard_limit bigint check (hard_limit is null or hard_limit >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commercial_entitlement_default_shape_check check (
    (value_type = 'boolean' and default_limit is null and hard_limit is null)
    or (value_type = 'limit' and default_limit is not null)
  ),
  constraint commercial_entitlement_limit_order_check check (
    hard_limit is null or default_limit <= hard_limit
  )
);

create index commercial_entitlement_adapter_idx
  on public.commercial_entitlement_definitions (adapter_id)
  where adapter_id is not null;

create table public.commercial_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null check (code ~ '^[a-z][a-z0-9_-]{1,39}$'),
  version integer not null check (version >= 1),
  name text not null check (char_length(name) between 2 and 120),
  description text,
  status text not null default 'draft' check (status in ('draft', 'active', 'retired')),
  is_default boolean not null default false,
  price_minor bigint check (price_minor is null or price_minor >= 0),
  currency text not null default 'USD' check (currency in ('USD', 'RUB', 'ARS', 'EUR')),
  billing_period text not null default 'none' check (billing_period in ('none', 'monthly', 'yearly')),
  row_version integer not null default 1 check (row_version >= 1),
  activated_at timestamptz,
  activated_by uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (code, version),
  constraint commercial_plan_default_status_check check (not is_default or status = 'active')
);

create unique index commercial_plans_active_code_idx
  on public.commercial_plans (code)
  where status = 'active';

create unique index commercial_plans_single_default_idx
  on public.commercial_plans ((is_default))
  where is_default = true and status = 'active';

create index commercial_plans_activated_by_idx
  on public.commercial_plans (activated_by) where activated_by is not null;
create index commercial_plans_created_by_idx
  on public.commercial_plans (created_by) where created_by is not null;
create index commercial_plans_updated_by_idx
  on public.commercial_plans (updated_by) where updated_by is not null;

create table public.commercial_plan_entitlements (
  plan_id uuid not null references public.commercial_plans (id) on delete cascade,
  entitlement_key text not null references public.commercial_entitlement_definitions (key) on delete restrict,
  enabled boolean not null default false,
  limit_value bigint check (limit_value is null or limit_value >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (plan_id, entitlement_key)
);

create index commercial_plan_entitlements_key_idx
  on public.commercial_plan_entitlements (entitlement_key, plan_id);

create table public.organizer_commercial_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organizer_user_id uuid not null references public.profiles (id) on delete cascade,
  plan_id uuid not null references public.commercial_plans (id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'scheduled', 'cancelled', 'expired')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  row_version integer not null default 1 check (row_version >= 1),
  assigned_by uuid references public.profiles (id) on delete set null,
  cancelled_by uuid references public.profiles (id) on delete set null,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizer_subscription_period_check check (ends_at is null or ends_at > starts_at)
);

create unique index organizer_commercial_subscription_active_idx
  on public.organizer_commercial_subscriptions (organizer_user_id)
  where status = 'active';

create index organizer_commercial_subscription_plan_idx
  on public.organizer_commercial_subscriptions (plan_id, status);

create index organizer_commercial_subscription_organizer_idx
  on public.organizer_commercial_subscriptions (organizer_user_id);
create index organizer_commercial_subscription_assigned_by_idx
  on public.organizer_commercial_subscriptions (assigned_by) where assigned_by is not null;
create index organizer_commercial_subscription_cancelled_by_idx
  on public.organizer_commercial_subscriptions (cancelled_by) where cancelled_by is not null;

create table public.organizer_entitlement_overrides (
  id uuid primary key default gen_random_uuid(),
  organizer_user_id uuid not null references public.profiles (id) on delete cascade,
  entitlement_key text not null references public.commercial_entitlement_definitions (key) on delete restrict,
  enabled boolean,
  limit_value bigint check (limit_value is null or limit_value >= 0),
  reason text not null check (char_length(reason) between 3 and 1000),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  row_version integer not null default 1 check (row_version >= 1),
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organizer_user_id, entitlement_key),
  constraint organizer_entitlement_override_value_check check (
    enabled is not null or limit_value is not null
  ),
  constraint organizer_entitlement_override_period_check check (
    ends_at is null or ends_at > starts_at
  )
);

create index organizer_entitlement_override_active_idx
  on public.organizer_entitlement_overrides (organizer_user_id, starts_at, ends_at);

create index organizer_entitlement_override_key_idx
  on public.organizer_entitlement_overrides (entitlement_key);
create index organizer_entitlement_override_updated_by_idx
  on public.organizer_entitlement_overrides (updated_by) where updated_by is not null;

alter table public.commercial_adapters enable row level security;
alter table public.commercial_entitlement_definitions enable row level security;
alter table public.commercial_plans enable row level security;
alter table public.commercial_plan_entitlements enable row level security;
alter table public.organizer_commercial_subscriptions enable row level security;
alter table public.organizer_entitlement_overrides enable row level security;

revoke all on table public.commercial_adapters from anon, authenticated;
revoke all on table public.commercial_entitlement_definitions from anon, authenticated;
revoke all on table public.commercial_plans from anon, authenticated;
revoke all on table public.commercial_plan_entitlements from anon, authenticated;
revoke all on table public.organizer_commercial_subscriptions from anon, authenticated;
revoke all on table public.organizer_entitlement_overrides from anon, authenticated;

grant all on table public.commercial_adapters to service_role;
grant all on table public.commercial_entitlement_definitions to service_role;
grant all on table public.commercial_plans to service_role;
grant all on table public.commercial_plan_entitlements to service_role;
grant all on table public.organizer_commercial_subscriptions to service_role;
grant all on table public.organizer_entitlement_overrides to service_role;

-- ---------------------------------------------------------------------------
-- Adapter and entitlement catalog. No secrets or provider credentials live here.
-- ---------------------------------------------------------------------------
insert into public.commercial_adapters (adapter_type, code, label, description, status)
values
  ('module', 'tours', 'Туры', 'Управление собственными турами', 'active'),
  ('module', 'excursions', 'Экскурсии', 'Управление собственными экскурсиями', 'active'),
  ('module', 'apartments', 'Апартаменты', 'Собственные объекты размещения', 'active'),
  ('module', 'cars', 'Автомобили', 'Собственный парк автомобилей', 'active'),
  ('module', 'transfers', 'Трансферы', 'Собственные трансферные услуги', 'active'),
  ('module', 'hotels', 'Отели', 'Зарезервировано для будущей разработки', 'future_disabled'),
  ('product', 'tour', 'Тур', 'Нативный туристический продукт', 'active'),
  ('product', 'excursion', 'Экскурсия', 'Нативная экскурсия', 'active'),
  ('product', 'apartment', 'Апартамент', 'Объект краткосрочной аренды', 'active'),
  ('product', 'car', 'Автомобиль', 'Автомобиль организатора', 'active'),
  ('product', 'transfer', 'Трансфер', 'Маршрут и транспорт организатора', 'active'),
  ('product', 'hotel', 'Отель', 'Только будущий контракт', 'future_disabled'),
  ('provider', 'goargentina', 'GoArgentina', 'Собственная платформа', 'active'),
  ('provider', 'tripster', 'Tripster', 'Партнёрский каталог', 'active'),
  ('provider', 'youtravel', 'YouTravel.me', 'Партнёрский каталог', 'active'),
  ('provider', 'sputnik8', 'Sputnik8', 'Affiliate-only каталог', 'active'),
  ('provider', 'localrent', 'LocalRent', 'Партнёрская аренда авто', 'active'),
  ('provider', 'intui', 'Intui', 'Партнёрские трансферы', 'active'),
  ('market', 'ar', 'Аргентина', 'Основной рынок', 'active'),
  ('market', 'br', 'Бразилия', 'Будущий рынок', 'future_disabled'),
  ('market', 'py', 'Парагвай', 'Будущий рынок', 'future_disabled')
on conflict (adapter_type, code) do nothing;

with definitions(key, label, description, value_type, adapter_type, adapter_code, default_limit, hard_limit) as (
  values
    ('analytics.basic', 'Базовая аналитика', 'Ключевые показатели организатора', 'boolean', null, null, null::bigint, null::bigint),
    ('analytics.advanced', 'Расширенная аналитика', 'Воронка и эффективность предложений', 'boolean', null, null, null::bigint, null::bigint),
    ('analytics.export', 'Экспорт аналитики', 'CSV-экспорт отчётов', 'boolean', null, null, null::bigint, null::bigint),
    ('module.tours.manage', 'Управление турами', 'Создание и управление своими турами', 'boolean', 'module', 'tours', null::bigint, null::bigint),
    ('module.excursions.manage', 'Управление экскурсиями', 'Создание собственных экскурсий', 'boolean', 'module', 'excursions', null::bigint, null::bigint),
    ('module.apartments.manage', 'Управление апартаментами', 'Создание объектов аренды', 'boolean', 'module', 'apartments', null::bigint, null::bigint),
    ('module.cars.manage', 'Управление автомобилями', 'Создание собственного автопарка', 'boolean', 'module', 'cars', null::bigint, null::bigint),
    ('module.transfers.manage', 'Управление трансферами', 'Создание трансферных услуг', 'boolean', 'module', 'transfers', null::bigint, null::bigint),
    ('module.hotels.manage', 'Управление отелями', 'Зарезервировано и всегда выключено', 'boolean', 'module', 'hotels', null::bigint, null::bigint),
    ('provider.localrent.access', 'LocalRent', 'Партнёрский адаптер аренды авто', 'boolean', 'provider', 'localrent', null::bigint, null::bigint),
    ('provider.intui.access', 'Intui', 'Партнёрский адаптер трансферов', 'boolean', 'provider', 'intui', null::bigint, null::bigint),
    ('market.ar.publish', 'Публикация в Аргентине', 'Основной рынок публикации', 'boolean', 'market', 'ar', null::bigint, null::bigint),
    ('limits.active_offers', 'Активные предложения', 'Максимум одновременно активных предложений', 'limit', null, null, 0::bigint, 10000::bigint),
    ('limits.team_members', 'Участники команды', 'Максимум сотрудников организатора', 'limit', null, null, 1::bigint, 100::bigint)
)
insert into public.commercial_entitlement_definitions (
  key, label, description, value_type, adapter_id, default_enabled, default_limit, hard_limit
)
select
  d.key,
  d.label,
  d.description,
  d.value_type,
  a.id,
  false,
  d.default_limit,
  d.hard_limit
from definitions d
left join public.commercial_adapters a
  on a.adapter_type = d.adapter_type and a.code = d.adapter_code
on conflict (key) do nothing;

insert into public.commercial_plans (
  code, version, name, description, status, is_default, price_minor, currency, billing_period
)
values
  ('starter', 1, 'Стартовый', 'Базовые инструменты для начала работы', 'active', true, 0, 'USD', 'none'),
  ('pro', 1, 'Профи', 'Расширенная аналитика и новые вертикали', 'active', false, null, 'USD', 'monthly'),
  ('agency', 1, 'Агентство', 'Команда и масштабирование предложений', 'active', false, null, 'USD', 'monthly')
on conflict (code, version) do nothing;

with grants(plan_code, entitlement_key, enabled, limit_value) as (
  values
    ('starter', 'analytics.basic', true, null::bigint),
    ('starter', 'module.tours.manage', true, null::bigint),
    ('starter', 'module.excursions.manage', true, null::bigint),
    ('starter', 'module.apartments.manage', true, null::bigint),
    ('starter', 'market.ar.publish', true, null::bigint),
    ('starter', 'limits.active_offers', true, 10::bigint),
    ('starter', 'limits.team_members', true, 1::bigint),
    ('pro', 'analytics.basic', true, null::bigint),
    ('pro', 'analytics.advanced', true, null::bigint),
    ('pro', 'analytics.export', true, null::bigint),
    ('pro', 'module.tours.manage', true, null::bigint),
    ('pro', 'module.excursions.manage', true, null::bigint),
    ('pro', 'module.apartments.manage', true, null::bigint),
    ('pro', 'module.cars.manage', true, null::bigint),
    ('pro', 'module.transfers.manage', true, null::bigint),
    ('pro', 'provider.localrent.access', true, null::bigint),
    ('pro', 'provider.intui.access', true, null::bigint),
    ('pro', 'market.ar.publish', true, null::bigint),
    ('pro', 'limits.active_offers', true, 100::bigint),
    ('pro', 'limits.team_members', true, 5::bigint),
    ('agency', 'analytics.basic', true, null::bigint),
    ('agency', 'analytics.advanced', true, null::bigint),
    ('agency', 'analytics.export', true, null::bigint),
    ('agency', 'module.tours.manage', true, null::bigint),
    ('agency', 'module.excursions.manage', true, null::bigint),
    ('agency', 'module.apartments.manage', true, null::bigint),
    ('agency', 'module.cars.manage', true, null::bigint),
    ('agency', 'module.transfers.manage', true, null::bigint),
    ('agency', 'provider.localrent.access', true, null::bigint),
    ('agency', 'provider.intui.access', true, null::bigint),
    ('agency', 'market.ar.publish', true, null::bigint),
    ('agency', 'limits.active_offers', true, 1000::bigint),
    ('agency', 'limits.team_members', true, 25::bigint)
)
insert into public.commercial_plan_entitlements (plan_id, entitlement_key, enabled, limit_value)
select p.id, g.entitlement_key, g.enabled, g.limit_value
from grants g
join public.commercial_plans p on p.code = g.plan_code and p.version = 1
on conflict (plan_id, entitlement_key) do nothing;

-- ---------------------------------------------------------------------------
-- CAS admin mutation functions. Audit is committed in the same transaction.
-- ---------------------------------------------------------------------------
create or replace function public.commercial_create_plan_version(
  p_code text,
  p_name text,
  p_description text,
  p_price_minor bigint,
  p_currency text,
  p_billing_period text,
  p_clone_from_plan_id uuid,
  p_actor_user_id uuid
)
returns public.commercial_plans
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_plan public.commercial_plans%rowtype;
  v_version integer;
begin
  if p_actor_user_id is null then
    raise exception using errcode = '22023', message = 'COMMERCIAL_ACTOR_REQUIRED';
  end if;
  if p_code !~ '^[a-z][a-z0-9_-]{1,39}$' then
    raise exception using errcode = '22023', message = 'INVALID_PLAN_CODE';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('commercial-plan:' || p_code, 0));
  select coalesce(max(version), 0) + 1 into v_version
  from public.commercial_plans
  where code = p_code;

  if p_clone_from_plan_id is not null and not exists (
    select 1 from public.commercial_plans where id = p_clone_from_plan_id
  ) then
    raise exception using errcode = 'P0002', message = 'CLONE_PLAN_NOT_FOUND';
  end if;

  insert into public.commercial_plans (
    code, version, name, description, status, is_default, price_minor,
    currency, billing_period, created_by, updated_by
  ) values (
    p_code,
    v_version,
    p_name,
    nullif(btrim(p_description), ''),
    'draft',
    false,
    p_price_minor,
    upper(p_currency),
    p_billing_period,
    p_actor_user_id,
    p_actor_user_id
  ) returning * into v_plan;

  if p_clone_from_plan_id is not null then
    insert into public.commercial_plan_entitlements (
      plan_id, entitlement_key, enabled, limit_value
    )
    select v_plan.id, entitlement_key, enabled, limit_value
    from public.commercial_plan_entitlements
    where plan_id = p_clone_from_plan_id;
  end if;

  insert into public.admin_audit_log (actor_user_id, action, entity_type, entity_id, payload)
  values (
    p_actor_user_id,
    'commercial.plan_created',
    'commercial_plan',
    v_plan.id::text,
    jsonb_build_object('code', v_plan.code, 'version', v_plan.version, 'cloneFromPlanId', p_clone_from_plan_id)
  );
  return v_plan;
end;
$$;

create or replace function public.commercial_update_draft_plan(
  p_plan_id uuid,
  p_expected_version integer,
  p_name text,
  p_description text,
  p_price_minor bigint,
  p_currency text,
  p_billing_period text,
  p_actor_user_id uuid
)
returns public.commercial_plans
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_plan public.commercial_plans%rowtype;
begin
  if p_actor_user_id is null then
    raise exception using errcode = '22023', message = 'COMMERCIAL_ACTOR_REQUIRED';
  end if;
  update public.commercial_plans
  set name = p_name,
      description = nullif(btrim(p_description), ''),
      price_minor = p_price_minor,
      currency = upper(p_currency),
      billing_period = p_billing_period,
      row_version = row_version + 1,
      updated_by = p_actor_user_id,
      updated_at = now()
  where id = p_plan_id and status = 'draft' and row_version = p_expected_version
  returning * into v_plan;

  if not found then
    raise exception using errcode = '40001', message = 'COMMERCIAL_PLAN_VERSION_CONFLICT';
  end if;

  insert into public.admin_audit_log (actor_user_id, action, entity_type, entity_id, payload)
  values (p_actor_user_id, 'commercial.plan_updated', 'commercial_plan', p_plan_id::text, jsonb_build_object('expectedVersion', p_expected_version));
  return v_plan;
end;
$$;

create or replace function public.commercial_set_plan_entitlement(
  p_plan_id uuid,
  p_expected_version integer,
  p_entitlement_key text,
  p_enabled boolean,
  p_limit_value bigint,
  p_actor_user_id uuid
)
returns public.commercial_plans
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_plan public.commercial_plans%rowtype;
  v_definition public.commercial_entitlement_definitions%rowtype;
  v_adapter_status text;
begin
  if p_actor_user_id is null then
    raise exception using errcode = '22023', message = 'COMMERCIAL_ACTOR_REQUIRED';
  end if;
  select * into v_definition
  from public.commercial_entitlement_definitions
  where key = p_entitlement_key and is_active = true;

  if not found then
    raise exception using errcode = 'P0002', message = 'ENTITLEMENT_NOT_FOUND';
  end if;
  if v_definition.adapter_id is not null then
    select status into v_adapter_status
    from public.commercial_adapters
    where id = v_definition.adapter_id;
  end if;
  if p_enabled and v_adapter_status = 'future_disabled' then
    raise exception using errcode = '42501', message = 'FUTURE_DISABLED_ENTITLEMENT';
  end if;
  if v_definition.value_type = 'boolean' and p_limit_value is not null then
    raise exception using errcode = '22023', message = 'BOOLEAN_ENTITLEMENT_HAS_LIMIT';
  end if;
  if v_definition.value_type = 'limit' and (
    p_limit_value is null or p_limit_value < 0
    or (v_definition.hard_limit is not null and p_limit_value > v_definition.hard_limit)
  ) then
    raise exception using errcode = '22023', message = 'INVALID_ENTITLEMENT_LIMIT';
  end if;

  update public.commercial_plans
  set row_version = row_version + 1, updated_by = p_actor_user_id, updated_at = now()
  where id = p_plan_id and status = 'draft' and row_version = p_expected_version
  returning * into v_plan;
  if not found then
    raise exception using errcode = '40001', message = 'COMMERCIAL_PLAN_VERSION_CONFLICT';
  end if;

  insert into public.commercial_plan_entitlements (plan_id, entitlement_key, enabled, limit_value)
  values (p_plan_id, p_entitlement_key, p_enabled, p_limit_value)
  on conflict (plan_id, entitlement_key) do update set
    enabled = excluded.enabled,
    limit_value = excluded.limit_value,
    updated_at = now();

  insert into public.admin_audit_log (actor_user_id, action, entity_type, entity_id, payload)
  values (
    p_actor_user_id,
    'commercial.plan_entitlement_updated',
    'commercial_plan',
    p_plan_id::text,
    jsonb_build_object('entitlementKey', p_entitlement_key, 'enabled', p_enabled, 'limitValue', p_limit_value, 'expectedVersion', p_expected_version)
  );
  return v_plan;
end;
$$;

create or replace function public.commercial_activate_plan(
  p_plan_id uuid,
  p_expected_version integer,
  p_make_default boolean,
  p_actor_user_id uuid
)
returns public.commercial_plans
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_plan public.commercial_plans%rowtype;
  v_should_default boolean;
begin
  if p_actor_user_id is null then
    raise exception using errcode = '22023', message = 'COMMERCIAL_ACTOR_REQUIRED';
  end if;
  select * into v_plan from public.commercial_plans where id = p_plan_id;
  if not found or v_plan.status <> 'draft' or v_plan.row_version <> p_expected_version then
    raise exception using errcode = '40001', message = 'COMMERCIAL_PLAN_VERSION_CONFLICT';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('commercial-plan:' || v_plan.code, 0));
  select * into v_plan from public.commercial_plans where id = p_plan_id for update;
  if not found or v_plan.status <> 'draft' or v_plan.row_version <> p_expected_version then
    raise exception using errcode = '40001', message = 'COMMERCIAL_PLAN_VERSION_CONFLICT';
  end if;

  select p_make_default or exists (
    select 1
    from public.commercial_plans
    where code = v_plan.code and status = 'active' and is_default = true
  ) into v_should_default;

  update public.commercial_plans
  set status = 'retired', is_default = false, row_version = row_version + 1, updated_at = now()
  where code = v_plan.code and status = 'active' and id <> p_plan_id;

  if v_should_default then
    update public.commercial_plans
    set is_default = false, row_version = row_version + 1, updated_at = now()
    where is_default = true and id <> p_plan_id;
  end if;

  update public.commercial_plans
  set status = 'active',
      is_default = v_should_default,
      activated_at = now(),
      activated_by = p_actor_user_id,
      updated_by = p_actor_user_id,
      row_version = row_version + 1,
      updated_at = now()
  where id = p_plan_id and status = 'draft' and row_version = p_expected_version
  returning * into v_plan;

  if not found then
    raise exception using errcode = '40001', message = 'COMMERCIAL_PLAN_VERSION_CONFLICT';
  end if;

  insert into public.admin_audit_log (actor_user_id, action, entity_type, entity_id, payload)
  values (p_actor_user_id, 'commercial.plan_activated', 'commercial_plan', p_plan_id::text, jsonb_build_object('code', v_plan.code, 'version', v_plan.version, 'isDefault', v_plan.is_default));
  return v_plan;
end;
$$;

create or replace function public.commercial_retire_plan(
  p_plan_id uuid,
  p_expected_version integer,
  p_actor_user_id uuid
)
returns public.commercial_plans
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_plan public.commercial_plans%rowtype;
begin
  if p_actor_user_id is null then
    raise exception using errcode = '22023', message = 'COMMERCIAL_ACTOR_REQUIRED';
  end if;
  update public.commercial_plans
  set status = 'retired',
      is_default = false,
      row_version = row_version + 1,
      updated_by = p_actor_user_id,
      updated_at = now()
  where id = p_plan_id
    and status in ('draft', 'active')
    and is_default = false
    and row_version = p_expected_version
  returning * into v_plan;
  if not found then
    raise exception using errcode = '40001', message = 'COMMERCIAL_PLAN_RETIRE_CONFLICT';
  end if;

  insert into public.admin_audit_log (actor_user_id, action, entity_type, entity_id, payload)
  values (p_actor_user_id, 'commercial.plan_retired', 'commercial_plan', p_plan_id::text, jsonb_build_object('code', v_plan.code, 'version', v_plan.version, 'expectedVersion', p_expected_version));
  return v_plan;
end;
$$;

create or replace function public.commercial_assign_organizer_plan(
  p_organizer_user_id uuid,
  p_plan_id uuid,
  p_expected_subscription_version integer,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_actor_user_id uuid
)
returns public.organizer_commercial_subscriptions
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_current public.organizer_commercial_subscriptions%rowtype;
  v_next public.organizer_commercial_subscriptions%rowtype;
begin
  if p_actor_user_id is null then
    raise exception using errcode = '22023', message = 'COMMERCIAL_ACTOR_REQUIRED';
  end if;
  if not exists (select 1 from public.commercial_plans where id = p_plan_id and status = 'active') then
    raise exception using errcode = '22023', message = 'PLAN_NOT_ACTIVE';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = p_organizer_user_id and roles @> array['organizer']::text[]
  ) then
    raise exception using errcode = '22023', message = 'ORGANIZER_NOT_FOUND';
  end if;
  if p_starts_at is not null and p_starts_at > now() then
    raise exception using errcode = '22023', message = 'FUTURE_SUBSCRIPTION_NOT_SUPPORTED';
  end if;

  select * into v_current
  from public.organizer_commercial_subscriptions
  where organizer_user_id = p_organizer_user_id and status = 'active'
  for update;

  if found then
    if v_current.row_version <> p_expected_subscription_version then
      raise exception using errcode = '40001', message = 'SUBSCRIPTION_VERSION_CONFLICT';
    end if;
    update public.organizer_commercial_subscriptions
    set status = 'cancelled',
        cancelled_by = p_actor_user_id,
        cancelled_at = now(),
        ends_at = coalesce(ends_at, now()),
        row_version = row_version + 1,
        updated_at = now()
    where id = v_current.id and row_version = p_expected_subscription_version;
  elsif p_expected_subscription_version <> 0 then
    raise exception using errcode = '40001', message = 'SUBSCRIPTION_VERSION_CONFLICT';
  end if;

  insert into public.organizer_commercial_subscriptions (
    organizer_user_id, plan_id, status, starts_at, ends_at, assigned_by
  ) values (
    p_organizer_user_id, p_plan_id, 'active', coalesce(p_starts_at, now()), p_ends_at, p_actor_user_id
  ) returning * into v_next;

  insert into public.admin_audit_log (actor_user_id, action, entity_type, entity_id, payload)
  values (
    p_actor_user_id,
    'commercial.subscription_assigned',
    'organizer_commercial_subscription',
    v_next.id::text,
    jsonb_build_object('organizerUserId', p_organizer_user_id, 'planId', p_plan_id, 'previousSubscriptionId', v_current.id)
  );
  return v_next;
end;
$$;

create or replace function public.commercial_upsert_organizer_override(
  p_organizer_user_id uuid,
  p_entitlement_key text,
  p_enabled boolean,
  p_limit_value bigint,
  p_reason text,
  p_ends_at timestamptz,
  p_expected_version integer,
  p_actor_user_id uuid
)
returns public.organizer_entitlement_overrides
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_existing public.organizer_entitlement_overrides%rowtype;
  v_next public.organizer_entitlement_overrides%rowtype;
  v_definition public.commercial_entitlement_definitions%rowtype;
  v_adapter_status text;
begin
  if p_actor_user_id is null then
    raise exception using errcode = '22023', message = 'COMMERCIAL_ACTOR_REQUIRED';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = p_organizer_user_id and roles @> array['organizer']::text[]
  ) then
    raise exception using errcode = '22023', message = 'ORGANIZER_NOT_FOUND';
  end if;
  select * into v_definition
  from public.commercial_entitlement_definitions
  where key = p_entitlement_key and is_active = true;
  if not found then
    raise exception using errcode = 'P0002', message = 'ENTITLEMENT_NOT_FOUND';
  end if;
  if v_definition.adapter_id is not null then
    select status into v_adapter_status
    from public.commercial_adapters
    where id = v_definition.adapter_id;
  end if;
  if p_enabled is true and v_adapter_status = 'future_disabled' then
    raise exception using errcode = '42501', message = 'FUTURE_DISABLED_ENTITLEMENT';
  end if;
  if p_enabled is null and p_limit_value is null then
    raise exception using errcode = '22023', message = 'EMPTY_OVERRIDE';
  end if;
  if v_definition.value_type = 'boolean' and p_limit_value is not null then
    raise exception using errcode = '22023', message = 'BOOLEAN_ENTITLEMENT_HAS_LIMIT';
  end if;
  if v_definition.value_type = 'limit' and (
    p_limit_value is null or p_limit_value < 0
    or (v_definition.hard_limit is not null and p_limit_value > v_definition.hard_limit)
  ) then
    raise exception using errcode = '22023', message = 'INVALID_ENTITLEMENT_LIMIT';
  end if;

  select * into v_existing
  from public.organizer_entitlement_overrides
  where organizer_user_id = p_organizer_user_id and entitlement_key = p_entitlement_key
  for update;

  if found then
    update public.organizer_entitlement_overrides
    set enabled = p_enabled,
        limit_value = p_limit_value,
        reason = p_reason,
        ends_at = p_ends_at,
        row_version = row_version + 1,
        updated_by = p_actor_user_id,
        updated_at = now()
    where id = v_existing.id and row_version = p_expected_version
    returning * into v_next;
    if not found then
      raise exception using errcode = '40001', message = 'OVERRIDE_VERSION_CONFLICT';
    end if;
  else
    if p_expected_version <> 0 then
      raise exception using errcode = '40001', message = 'OVERRIDE_VERSION_CONFLICT';
    end if;
    insert into public.organizer_entitlement_overrides (
      organizer_user_id, entitlement_key, enabled, limit_value, reason, ends_at, updated_by
    ) values (
      p_organizer_user_id, p_entitlement_key, p_enabled, p_limit_value, p_reason, p_ends_at, p_actor_user_id
    ) returning * into v_next;
  end if;

  insert into public.admin_audit_log (actor_user_id, action, entity_type, entity_id, payload)
  values (
    p_actor_user_id,
    'commercial.entitlement_override_upserted',
    'organizer_entitlement_override',
    v_next.id::text,
    jsonb_build_object('organizerUserId', p_organizer_user_id, 'entitlementKey', p_entitlement_key, 'expectedVersion', p_expected_version, 'reason', p_reason)
  );
  return v_next;
end;
$$;

create or replace function public.commercial_delete_organizer_override(
  p_override_id uuid,
  p_expected_version integer,
  p_actor_user_id uuid
)
returns uuid
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_override public.organizer_entitlement_overrides%rowtype;
begin
  if p_actor_user_id is null then
    raise exception using errcode = '22023', message = 'COMMERCIAL_ACTOR_REQUIRED';
  end if;
  delete from public.organizer_entitlement_overrides
  where id = p_override_id and row_version = p_expected_version
  returning * into v_override;
  if not found then
    raise exception using errcode = '40001', message = 'OVERRIDE_VERSION_CONFLICT';
  end if;

  insert into public.admin_audit_log (actor_user_id, action, entity_type, entity_id, payload)
  values (
    p_actor_user_id,
    'commercial.entitlement_override_deleted',
    'organizer_entitlement_override',
    p_override_id::text,
    jsonb_build_object('organizerUserId', v_override.organizer_user_id, 'entitlementKey', v_override.entitlement_key, 'expectedVersion', p_expected_version)
  );
  return p_override_id;
end;
$$;

revoke all on function public.commercial_create_plan_version(text, text, text, bigint, text, text, uuid, uuid) from public, anon, authenticated;
revoke all on function public.commercial_update_draft_plan(uuid, integer, text, text, bigint, text, text, uuid) from public, anon, authenticated;
revoke all on function public.commercial_set_plan_entitlement(uuid, integer, text, boolean, bigint, uuid) from public, anon, authenticated;
revoke all on function public.commercial_activate_plan(uuid, integer, boolean, uuid) from public, anon, authenticated;
revoke all on function public.commercial_retire_plan(uuid, integer, uuid) from public, anon, authenticated;
revoke all on function public.commercial_assign_organizer_plan(uuid, uuid, integer, timestamptz, timestamptz, uuid) from public, anon, authenticated;
revoke all on function public.commercial_upsert_organizer_override(uuid, text, boolean, bigint, text, timestamptz, integer, uuid) from public, anon, authenticated;
revoke all on function public.commercial_delete_organizer_override(uuid, integer, uuid) from public, anon, authenticated;

grant execute on function public.commercial_create_plan_version(text, text, text, bigint, text, text, uuid, uuid) to service_role;
grant execute on function public.commercial_update_draft_plan(uuid, integer, text, text, bigint, text, text, uuid) to service_role;
grant execute on function public.commercial_set_plan_entitlement(uuid, integer, text, boolean, bigint, uuid) to service_role;
grant execute on function public.commercial_activate_plan(uuid, integer, boolean, uuid) to service_role;
grant execute on function public.commercial_retire_plan(uuid, integer, uuid) to service_role;
grant execute on function public.commercial_assign_organizer_plan(uuid, uuid, integer, timestamptz, timestamptz, uuid) to service_role;
grant execute on function public.commercial_upsert_organizer_override(uuid, text, boolean, bigint, text, timestamptz, integer, uuid) to service_role;
grant execute on function public.commercial_delete_organizer_override(uuid, integer, uuid) to service_role;

comment on table public.commercial_plans is 'Versioned organizer commercial plans; active versions are immutable';
comment on table public.commercial_adapters is 'Reusable module/product/provider/market adapter registry without credentials';
comment on table public.organizer_entitlement_overrides is 'Audited per-organizer exceptions applied after plan grants';
