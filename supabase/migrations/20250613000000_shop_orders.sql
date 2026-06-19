-- Phase 3: Shop orders (PDF guides)
-- Apply via: npm run supabase:migrate

create table if not exists public.shop_orders (
  id text primary key,
  user_id uuid references auth.users (id) on delete set null,
  guest_email text,
  product_id text not null,
  product_slug text not null,
  product_title text not null,
  price_usd numeric(12, 2) not null default 0,
  currency text not null default 'USD',
  status text not null default 'pending',
  payment_status text not null default 'pending',
  customer_name text not null default '',
  customer_email text not null,
  customer_phone text not null default '',
  delivery_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shop_orders_status_check check (
    status in ('pending', 'awaiting_payment', 'paid', 'delivered', 'cancelled')
  ),
  constraint shop_orders_payment_status_check check (
    payment_status in ('pending', 'paid', 'refunded')
  )
);

create index if not exists shop_orders_user_id_idx on public.shop_orders (user_id);
create index if not exists shop_orders_guest_email_idx on public.shop_orders (lower(guest_email));
create index if not exists shop_orders_customer_email_idx on public.shop_orders (lower(customer_email));
create index if not exists shop_orders_product_slug_idx on public.shop_orders (product_slug);
create index if not exists shop_orders_created_at_idx on public.shop_orders (created_at desc);

drop trigger if exists shop_orders_set_updated_at on public.shop_orders;
create trigger shop_orders_set_updated_at
  before update on public.shop_orders
  for each row execute function public.set_updated_at();

comment on table public.shop_orders is 'Digital shop orders — manual payment and PDF delivery';

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.shop_orders enable row level security;

drop policy if exists "shop_orders_insert_authenticated" on public.shop_orders;
create policy "shop_orders_insert_authenticated"
  on public.shop_orders for insert
  to authenticated
  with check (
    user_id = auth.uid()
    or (user_id is null and guest_email is not null)
  );

drop policy if exists "shop_orders_insert_guest" on public.shop_orders;
create policy "shop_orders_insert_guest"
  on public.shop_orders for insert
  to anon
  with check (user_id is null and guest_email is not null);

drop policy if exists "shop_orders_select_owner" on public.shop_orders;
create policy "shop_orders_select_owner"
  on public.shop_orders for select
  to authenticated
  using (
    user_id = auth.uid()
    or lower(customer_email) = lower(
      coalesce(
        (select email from public.profiles where id = auth.uid()),
        ''
      )
    )
    or lower(guest_email) = lower(
      coalesce(
        (select email from public.profiles where id = auth.uid()),
        ''
      )
    )
  );
