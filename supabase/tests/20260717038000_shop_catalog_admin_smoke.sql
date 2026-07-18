\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email, raw_user_meta_data)
values (
  '10000000-0000-4000-8000-000000000001',
  'shop-smoke@example.invalid',
  '{}'::jsonb
);
insert into public.admin_staff (user_id, capabilities, is_active)
values ('10000000-0000-4000-8000-000000000001', array['operations.shop'], true);
update public.profiles
set roles = array['admin']::text[], active_role = 'admin', is_blocked = false
where id = '10000000-0000-4000-8000-000000000001';

do $$
declare
  actor constant uuid := '10000000-0000-4000-8000-000000000001';
  response jsonb;
  category_id uuid;
  product_id text;
  product_version bigint;
  product_updated_at timestamptz;
begin
  response := public.admin_manage_shop_category(
    'create', actor, null, null, null, 'smoke-guides', 'Smoke guides', null, 10, '127.0.0.1'
  );
  if response->>'ok' <> 'true' then raise exception 'category create failed: %', response; end if;
  category_id := (response#>>'{category,id}')::uuid;

  response := public.admin_manage_shop_product(
    'create', actor, null, null, null, category_id, 'smoke-product', 'Smoke product',
    'A complete smoke description for a managed catalog product.', 'PDF, 10 pages',
    'digital', 1900, 'USD', 'unlimited', null, 'draft', null, null, '[]'::jsonb, '127.0.0.1'
  );
  if response->>'ok' <> 'true' then raise exception 'draft create failed: %', response; end if;
  product_id := response#>>'{product,id}';
  select version, updated_at into product_version, product_updated_at
  from public.shop_products where id = product_id;

  response := public.admin_manage_shop_product(
    'update', actor, product_id, product_version, product_updated_at, category_id,
    'smoke-product', 'Smoke product', 'A complete smoke description for a managed catalog product.',
    'PDF, 10 pages', 'digital', 1900, 'USD', 'unlimited', null, 'published',
    'Smoke product SEO',
    'A sufficiently descriptive search summary for the managed smoke product and its contents.',
    '[{"url":"/media/shop/smoke.jpg","alt":"Smoke catalog cover"}]'::jsonb, '127.0.0.1'
  );
  if response->>'ok' <> 'true' then raise exception 'publish failed: %', response; end if;

  response := public.admin_manage_shop_product(
    'update', actor, product_id, product_version, product_updated_at, category_id,
    'smoke-product', 'Smoke product', 'A complete smoke description for a managed catalog product.',
    'PDF, 10 pages', 'digital', 1900, 'USD', 'unlimited', null, 'published',
    'Smoke product SEO',
    'A sufficiently descriptive search summary for the managed smoke product and its contents.',
    '[{"url":"/media/shop/smoke.jpg","alt":"Smoke catalog cover"}]'::jsonb, '127.0.0.1'
  );
  if response->>'code' <> 'version_conflict' then raise exception 'stale CAS was accepted: %', response; end if;

  select version, updated_at into product_version, product_updated_at
  from public.shop_products where id = product_id;
  insert into public.shop_orders (
    id, product_id, product_slug, product_title, price_usd, currency,
    customer_name, customer_email
  ) values (
    'shop-smoke-order', product_id, 'smoke-product', 'Smoke product', 19.00, 'USD',
    'Smoke', 'shop-smoke-customer@example.invalid'
  );
  response := public.admin_manage_shop_product(
    'archive', actor, product_id, product_version, product_updated_at, null,
    'unused', 'unused', '', '', 'digital', 0, 'USD', 'out_of_stock', 0,
    'draft', null, null, '[]'::jsonb, '127.0.0.1'
  );
  if response->>'ok' <> 'true' then raise exception 'archive failed: %', response; end if;
  if (select status from public.shop_products where id = product_id) <> 'archived' then
    raise exception 'archive did not preserve product';
  end if;
  if not exists (
    select 1 from public.admin_audit_log
    where actor_user_id = actor and action = 'shop.product.archive' and entity_id = product_id
  ) then raise exception 'atomic audit row missing'; end if;

  begin
    delete from public.shop_products where id = product_id;
    raise exception 'order-linked product was physically deleted';
  exception when foreign_key_violation then
    null;
  end;
end;
$$;

rollback;
