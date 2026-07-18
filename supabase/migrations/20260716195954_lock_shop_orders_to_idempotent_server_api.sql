-- Shop orders are created only by the validated, rate-limited and idempotent
-- server route. Direct Data API inserts bypass product pricing and notifications.

drop policy if exists "shop_orders_insert_authenticated" on public.shop_orders;
drop policy if exists "shop_orders_insert_guest" on public.shop_orders;

revoke insert on table public.shop_orders from anon, authenticated;
grant select, insert, update, delete on table public.shop_orders to service_role;

comment on table public.shop_orders is
  'Digital shop orders; creation is restricted to the idempotent server API.';
