-- Owner-managed shop catalog. Money is stored exclusively in integer minor units.

create table if not exists public.shop_product_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shop_product_categories_slug_check
    check (slug ~ '^[a-z0-9][a-z0-9-]{1,79}$'),
  constraint shop_product_categories_name_check
    check (char_length(trim(name)) between 2 and 100),
  constraint shop_product_categories_description_check
    check (description is null or char_length(description) <= 1000),
  constraint shop_product_categories_sort_order_check
    check (sort_order between 0 and 32767),
  constraint shop_product_categories_version_check check (version > 0)
);

create table if not exists public.shop_products (
  id text primary key,
  category_id uuid references public.shop_product_categories (id) on delete set null,
  slug text not null unique,
  title text not null,
  description text not null default '',
  format_label text not null default '',
  delivery_type text not null default 'digital',
  price_minor bigint not null default 0,
  currency text not null default 'USD',
  availability text not null default 'out_of_stock',
  stock_quantity integer,
  status text not null default 'draft',
  seo_title text,
  seo_description text,
  version bigint not null default 1,
  published_at timestamptz,
  archived_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shop_products_id_check check (id ~ '^shop-[a-z0-9-]{8,80}$'),
  constraint shop_products_slug_check check (slug ~ '^[a-z0-9][a-z0-9-]{1,119}$'),
  constraint shop_products_title_check check (char_length(trim(title)) between 2 and 160),
  constraint shop_products_description_check check (char_length(description) <= 10000),
  constraint shop_products_format_check check (char_length(format_label) <= 160),
  constraint shop_products_delivery_type_check check (delivery_type in ('digital', 'physical', 'service')),
  constraint shop_products_price_minor_check check (price_minor between 0 and 999999999999),
  constraint shop_products_currency_check check (currency ~ '^[A-Z]{3}$'),
  constraint shop_products_availability_check
    check (availability in ('unlimited', 'in_stock', 'out_of_stock', 'preorder')),
  constraint shop_products_stock_quantity_check check (stock_quantity is null or stock_quantity >= 0),
  constraint shop_products_stock_semantics_check check (
    (availability = 'unlimited' and stock_quantity is null)
    or (availability = 'in_stock' and stock_quantity > 0)
    or (availability = 'out_of_stock' and stock_quantity = 0)
    or availability = 'preorder'
  ),
  constraint shop_products_status_check check (status in ('draft', 'published', 'archived')),
  constraint shop_products_seo_title_check check (seo_title is null or char_length(seo_title) <= 70),
  constraint shop_products_seo_description_check
    check (seo_description is null or char_length(seo_description) <= 180),
  constraint shop_products_version_check check (version > 0),
  constraint shop_products_lifecycle_check check (
    (status = 'draft' and archived_at is null)
    or (status = 'published' and published_at is not null and archived_at is null)
    or (status = 'archived' and archived_at is not null)
  )
);

create table if not exists public.shop_product_images (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.shop_products (id) on delete cascade,
  url text not null,
  alt text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint shop_product_images_url_check check (
    char_length(url) between 2 and 2048
    and (url like '/media/%' or url ~ '^https://([a-z0-9-]+\.)*(supabase\.co|goargentina\.ru)/')
  ),
  constraint shop_product_images_alt_check check (char_length(trim(alt)) between 2 and 300),
  constraint shop_product_images_sort_order_check check (sort_order between 0 and 7),
  constraint shop_product_images_product_sort_unique unique (product_id, sort_order)
);

create index if not exists shop_product_categories_active_sort_idx
  on public.shop_product_categories (sort_order, name) where is_active = true;
create index if not exists shop_products_category_idx on public.shop_products (category_id);
create index if not exists shop_products_published_idx
  on public.shop_products (published_at desc, title) where status = 'published';
create index if not exists shop_products_status_updated_idx
  on public.shop_products (status, updated_at desc);
create index if not exists shop_product_images_product_idx
  on public.shop_product_images (product_id, sort_order);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'shop_orders_product_id_catalog_fk'
  ) then
    alter table public.shop_orders
      add constraint shop_orders_product_id_catalog_fk
      foreign key (product_id) references public.shop_products (id)
      on delete restrict not valid;
  end if;
end;
$$;

alter table public.shop_product_categories enable row level security;
alter table public.shop_products enable row level security;
alter table public.shop_product_images enable row level security;

revoke all on public.shop_product_categories from public, anon, authenticated;
revoke all on public.shop_products from public, anon, authenticated;
revoke all on public.shop_product_images from public, anon, authenticated;
grant select on public.shop_product_categories, public.shop_products, public.shop_product_images
  to anon, authenticated;
grant all on public.shop_product_categories, public.shop_products, public.shop_product_images
  to service_role;

create policy "shop_categories_public_read"
  on public.shop_product_categories for select to anon, authenticated
  using (is_active = true);
create policy "shop_products_public_read"
  on public.shop_products for select to anon, authenticated
  using (
    status = 'published'
    and exists (
      select 1 from public.shop_product_categories category
      where category.id = category_id and category.is_active = true
    )
  );
create policy "shop_product_images_public_read"
  on public.shop_product_images for select to anon, authenticated
  using (
    exists (
      select 1 from public.shop_products product
      join public.shop_product_categories category on category.id = product.category_id
      where product.id = product_id
        and product.status = 'published'
        and category.is_active = true
    )
  );

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.admin_shop_catalog_actor_allowed(p_actor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.profiles profile
    join public.admin_staff staff on staff.user_id = profile.id
    where profile.id = p_actor_id
      and profile.roles @> array['admin']::text[]
      and not coalesce(profile.is_blocked, false)
      and staff.is_active = true
      and ('*' = any(staff.capabilities) or 'operations.shop' = any(staff.capabilities))
  );
$$;

revoke execute on function private.admin_shop_catalog_actor_allowed(uuid)
  from public, anon, authenticated, service_role;

create or replace function public.admin_manage_shop_category(
  p_action text,
  p_actor_id uuid,
  p_category_id uuid,
  p_expected_version bigint,
  p_expected_updated_at timestamptz,
  p_slug text,
  p_name text,
  p_description text,
  p_sort_order integer,
  p_ip_address text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  category_row public.shop_product_categories%rowtype;
  published_count bigint;
  normalized_slug text := lower(trim(coalesce(p_slug, '')));
  normalized_name text := trim(coalesce(p_name, ''));
  normalized_description text := nullif(trim(coalesce(p_description, '')), '');
begin
  if not private.admin_shop_catalog_actor_allowed(p_actor_id) then
    return jsonb_build_object('ok', false, 'code', 'forbidden');
  end if;
  if p_action not in ('create', 'update', 'archive') then
    return jsonb_build_object('ok', false, 'code', 'invalid_action');
  end if;

  if p_action = 'create' then
    if normalized_slug !~ '^[a-z0-9][a-z0-9-]{1,79}$'
      or char_length(normalized_name) not between 2 and 100
      or char_length(coalesce(normalized_description, '')) > 1000
      or p_sort_order is null or p_sort_order not between 0 and 32767 then
      return jsonb_build_object('ok', false, 'code', 'invalid_input');
    end if;
    begin
      insert into public.shop_product_categories (slug, name, description, sort_order)
      values (normalized_slug, normalized_name, normalized_description, p_sort_order)
      returning * into category_row;
    exception when unique_violation then
      return jsonb_build_object('ok', false, 'code', 'slug_conflict');
    end;
  else
    if p_category_id is null or p_expected_version is null or p_expected_updated_at is null then
      return jsonb_build_object('ok', false, 'code', 'invalid_input');
    end if;
    select * into category_row from public.shop_product_categories
    where id = p_category_id for update;
    if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
    if category_row.version <> p_expected_version
      or category_row.updated_at is distinct from p_expected_updated_at then
      return jsonb_build_object('ok', false, 'code', 'version_conflict');
    end if;

    if p_action = 'archive' then
      select count(*) into published_count from public.shop_products
      where category_id = category_row.id and status = 'published';
      if published_count > 0 then
        return jsonb_build_object('ok', false, 'code', 'category_has_published_products');
      end if;
      update public.shop_product_categories
      set is_active = false, version = version + 1, updated_at = clock_timestamp()
      where id = category_row.id returning * into category_row;
    else
      if normalized_slug !~ '^[a-z0-9][a-z0-9-]{1,79}$'
        or char_length(normalized_name) not between 2 and 100
        or char_length(coalesce(normalized_description, '')) > 1000
        or p_sort_order is null or p_sort_order not between 0 and 32767 then
        return jsonb_build_object('ok', false, 'code', 'invalid_input');
      end if;
      begin
        update public.shop_product_categories
        set slug = normalized_slug, name = normalized_name,
            description = normalized_description, sort_order = p_sort_order,
            is_active = true, version = version + 1, updated_at = clock_timestamp()
        where id = category_row.id returning * into category_row;
      exception when unique_violation then
        return jsonb_build_object('ok', false, 'code', 'slug_conflict');
      end;
    end if;
  end if;

  insert into public.admin_audit_log (
    actor_user_id, action, entity_type, entity_id, payload, ip_address
  ) values (
    p_actor_id, 'shop.category.' || p_action, 'shop_product_category', category_row.id::text,
    jsonb_build_object('slug', category_row.slug, 'name', category_row.name,
      'isActive', category_row.is_active, 'version', category_row.version),
    nullif(trim(coalesce(p_ip_address, '')), '')
  );
  return jsonb_build_object('ok', true, 'category', to_jsonb(category_row));
end;
$$;

revoke execute on function public.admin_manage_shop_category(
  text, uuid, uuid, bigint, timestamptz, text, text, text, integer, text
) from public, anon, authenticated;
grant execute on function public.admin_manage_shop_category(
  text, uuid, uuid, bigint, timestamptz, text, text, text, integer, text
) to service_role;

create or replace function public.admin_manage_shop_product(
  p_action text,
  p_actor_id uuid,
  p_product_id text,
  p_expected_version bigint,
  p_expected_updated_at timestamptz,
  p_category_id uuid,
  p_slug text,
  p_title text,
  p_description text,
  p_format_label text,
  p_delivery_type text,
  p_price_minor bigint,
  p_currency text,
  p_availability text,
  p_stock_quantity integer,
  p_status text,
  p_seo_title text,
  p_seo_description text,
  p_images jsonb,
  p_ip_address text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  product_row public.shop_products%rowtype;
  normalized_id text;
  normalized_slug text := lower(trim(coalesce(p_slug, '')));
  normalized_title text := trim(coalesce(p_title, ''));
  normalized_description text := trim(coalesce(p_description, ''));
  normalized_format text := trim(coalesce(p_format_label, ''));
  normalized_currency text := upper(trim(coalesce(p_currency, '')));
  normalized_seo_title text := nullif(trim(coalesce(p_seo_title, '')), '');
  normalized_seo_description text := nullif(trim(coalesce(p_seo_description, '')), '');
  category_active boolean;
begin
  if not private.admin_shop_catalog_actor_allowed(p_actor_id) then
    return jsonb_build_object('ok', false, 'code', 'forbidden');
  end if;
  if p_action not in ('create', 'update', 'archive') then
    return jsonb_build_object('ok', false, 'code', 'invalid_action');
  end if;

  if p_action = 'archive' then
    if p_product_id is null or p_expected_version is null or p_expected_updated_at is null then
      return jsonb_build_object('ok', false, 'code', 'invalid_input');
    end if;
    select * into product_row from public.shop_products
    where id = p_product_id for update;
    if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
    if product_row.version <> p_expected_version
      or product_row.updated_at is distinct from p_expected_updated_at then
      return jsonb_build_object('ok', false, 'code', 'version_conflict');
    end if;
    update public.shop_products
    set status = 'archived', archived_at = clock_timestamp(), updated_by = p_actor_id,
        version = version + 1, updated_at = clock_timestamp()
    where id = product_row.id returning * into product_row;
  else
    if p_category_id is null
      or normalized_slug !~ '^[a-z0-9][a-z0-9-]{1,119}$'
      or char_length(normalized_title) not between 2 and 160
      or char_length(normalized_description) > 10000
      or char_length(normalized_format) > 160
      or p_delivery_type not in ('digital', 'physical', 'service')
      or p_price_minor is null or p_price_minor not between 0 and 999999999999
      or normalized_currency !~ '^[A-Z]{3}$'
      or p_availability not in ('unlimited', 'in_stock', 'out_of_stock', 'preorder')
      or p_status not in ('draft', 'published')
      or (p_availability = 'unlimited' and p_stock_quantity is not null)
      or (p_availability = 'in_stock' and coalesce(p_stock_quantity, 0) <= 0)
      or (p_availability = 'out_of_stock' and p_stock_quantity is distinct from 0)
      or (p_stock_quantity is not null and p_stock_quantity < 0)
      or char_length(coalesce(normalized_seo_title, '')) > 70
      or char_length(coalesce(normalized_seo_description, '')) > 180
      or jsonb_typeof(p_images) is distinct from 'array'
      or jsonb_array_length(p_images) > 8
      or exists (
        select 1 from jsonb_array_elements(p_images) image
        where jsonb_typeof(image) is distinct from 'object'
          or trim(coalesce(image->>'url', '')) !~ '^(/media/|https://([a-z0-9-]+\.)*(supabase\.co|goargentina\.ru)/)'
          or char_length(trim(coalesce(image->>'alt', ''))) not between 2 and 300
      ) then
      return jsonb_build_object('ok', false, 'code', 'invalid_input');
    end if;

    select is_active into category_active from public.shop_product_categories
    where id = p_category_id;
    if category_active is distinct from true then
      return jsonb_build_object('ok', false, 'code', 'category_unavailable');
    end if;

    if p_status = 'published' and (
      char_length(normalized_description) < 20
      or char_length(normalized_format) < 2
      or p_price_minor <= 0
      or jsonb_array_length(p_images) = 0
      or normalized_seo_title is null
      or char_length(normalized_seo_description) < 50
    ) then
      return jsonb_build_object('ok', false, 'code', 'publish_requirements');
    end if;

    if p_action = 'create' then
      normalized_id := 'shop-' || replace(gen_random_uuid()::text, '-', '');
      begin
        insert into public.shop_products (
          id, category_id, slug, title, description, format_label, delivery_type,
          price_minor, currency, availability, stock_quantity, status,
          seo_title, seo_description, published_at, created_by, updated_by
        ) values (
          normalized_id, p_category_id, normalized_slug, normalized_title,
          normalized_description, normalized_format, p_delivery_type,
          p_price_minor, normalized_currency, p_availability, p_stock_quantity, p_status,
          normalized_seo_title, normalized_seo_description,
          case when p_status = 'published' then clock_timestamp() else null end,
          p_actor_id, p_actor_id
        ) returning * into product_row;
      exception when unique_violation then
        return jsonb_build_object('ok', false, 'code', 'slug_conflict');
      end;
    else
      if p_product_id is null or p_expected_version is null or p_expected_updated_at is null then
        return jsonb_build_object('ok', false, 'code', 'invalid_input');
      end if;
      select * into product_row from public.shop_products
      where id = p_product_id for update;
      if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
      if product_row.version <> p_expected_version
        or product_row.updated_at is distinct from p_expected_updated_at then
        return jsonb_build_object('ok', false, 'code', 'version_conflict');
      end if;
      begin
        update public.shop_products
        set category_id = p_category_id, slug = normalized_slug, title = normalized_title,
            description = normalized_description, format_label = normalized_format,
            delivery_type = p_delivery_type, price_minor = p_price_minor,
            currency = normalized_currency, availability = p_availability,
            stock_quantity = p_stock_quantity, status = p_status,
            seo_title = normalized_seo_title, seo_description = normalized_seo_description,
            published_at = case
              when p_status = 'published' then coalesce(published_at, clock_timestamp())
              else published_at end,
            archived_at = null, updated_by = p_actor_id,
            version = version + 1, updated_at = clock_timestamp()
        where id = product_row.id returning * into product_row;
      exception when unique_violation then
        return jsonb_build_object('ok', false, 'code', 'slug_conflict');
      end;
      delete from public.shop_product_images where product_id = product_row.id;
    end if;

    insert into public.shop_product_images (product_id, url, alt, sort_order)
    select product_row.id, trim(image.value->>'url'), trim(image.value->>'alt'), image.ordinality - 1
    from jsonb_array_elements(p_images) with ordinality as image(value, ordinality);
  end if;

  insert into public.admin_audit_log (
    actor_user_id, action, entity_type, entity_id, payload, ip_address
  ) values (
    p_actor_id, 'shop.product.' || p_action, 'shop_product', product_row.id,
    jsonb_build_object('slug', product_row.slug, 'title', product_row.title,
      'status', product_row.status, 'priceMinor', product_row.price_minor,
      'currency', product_row.currency, 'version', product_row.version),
    nullif(trim(coalesce(p_ip_address, '')), '')
  );
  return jsonb_build_object('ok', true, 'product', to_jsonb(product_row));
end;
$$;

revoke execute on function public.admin_manage_shop_product(
  text, uuid, text, bigint, timestamptz, uuid, text, text, text, text, text,
  bigint, text, text, integer, text, text, text, jsonb, text
) from public, anon, authenticated;
grant execute on function public.admin_manage_shop_product(
  text, uuid, text, bigint, timestamptz, uuid, text, text, text, text, text,
  bigint, text, text, integer, text, text, text, jsonb, text
) to service_role;

-- Preserve the six editorial products as the initial managed catalog.
insert into public.shop_product_categories (slug, name, description, sort_order)
values ('digital-guides', 'Цифровые гиды', 'Путеводители и списки для самостоятельной поездки.', 10)
on conflict (slug) do nothing;

with category as (
  select id from public.shop_product_categories where slug = 'digital-guides'
)
insert into public.shop_products (
  id, category_id, slug, title, description, format_label, delivery_type,
  price_minor, currency, availability, stock_quantity, status,
  seo_title, seo_description, published_at
)
select seed.id, category.id, seed.slug, seed.title, seed.description, seed.format_label,
  'digital', seed.price_minor, 'USD', 'unlimited', null, 'published',
  seed.title, seed.seo_description, now()
from category cross join (values
  ('shop-patagonia-guide', 'patagonia-pdf-guide', 'PDF-путеводитель: Патагония', 'Маршруты, сезоны, снаряжение для треккинга и практические советы по Эль-Калафате, Чалтен и Ушуайе.', 'PDF, 48 страниц', 1900, 'Практический PDF-гид по Патагонии: маршруты, сезоны, экипировка и советы по ключевым направлениям региона.'),
  ('shop-ba-guide', 'buenos-aires-city-guide', 'Гид по Буэнос-Айресу', 'Районы, milonga для начинающих, asado и безопасные маршруты на 3–5 дней в столице.', 'PDF, 36 страниц', 1500, 'Практический городской гид по Буэнос-Айресу: районы, маршруты, еда, танго и советы для первой поездки.'),
  ('shop-immigration-checklist', 'immigration-checklist', 'Список документов для въезда', 'Список документов, сроки, ссылки на Migraciones и типичные ошибки перед поездкой в Аргентину.', 'PDF, 12 страниц', 900, 'Проверочный список документов для въезда в Аргентину, важные сроки, официальные источники и частые ошибки.'),
  ('shop-wine-guide', 'mendoza-wine-guide', 'Винный гид Мендосы', 'Bodegas, регионы Uco Valley и Luján de Cuyo, дегустации и логистика винных туров.', 'PDF, 32 страницы', 1400, 'Винный гид по Мендосе: регионы, bodegas, дегустации, транспорт и практическая подготовка к поездке.'),
  ('shop-northwest-guide', 'salta-northwest-guide', 'Северо-запад: Сальта и Кафаяте', 'Каньоны, солончаки, высоты и автомаршруты по провинции Сальта и Жужуй.', 'PDF, 40 страниц', 1600, 'Путеводитель по Сальте, Кафаяте и Жужую: маршруты, высоты, каньоны, солончаки и автомобильная логистика.'),
  ('shop-family-checklist', 'family-travel-checklist', 'Список для семейной поездки', 'Документы детей, медицина, страховка, развлечения и подбор туров для семей с детьми.', 'PDF, 10 страниц', 700, 'Семейный список подготовки к Аргентине: документы детей, медицина, страховка, досуг и поездки по стране.')
) as seed(id, slug, title, description, format_label, price_minor, seo_description)
on conflict (id) do nothing;

insert into public.shop_product_images (product_id, url, alt, sort_order)
values
  ('shop-patagonia-guide', '/media/shop/patagonia-pdf-guide.jpg', 'Путеводитель по Патагонии', 0),
  ('shop-ba-guide', '/media/shop/buenos-aires-city-guide.jpg', 'Гид по Буэнос-Айресу', 0),
  ('shop-immigration-checklist', '/media/shop/immigration-checklist.jpg', 'Список документов для въезда в Аргентину', 0),
  ('shop-wine-guide', '/media/shop/mendoza-wine-guide.jpg', 'Винный гид по Мендосе', 0),
  ('shop-northwest-guide', '/media/shop/salta-northwest-guide.jpg', 'Путеводитель по северо-западу Аргентины', 0),
  ('shop-family-checklist', '/media/shop/family-travel-checklist.jpg', 'Список для семейной поездки в Аргентину', 0)
on conflict (product_id, sort_order) do nothing;

comment on table public.shop_products is
  'Owner-managed shop catalog. Prices are integer minor units; lifecycle changes use audited CAS RPCs.';
