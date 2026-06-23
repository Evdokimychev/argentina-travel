-- YouTravel.me on-site booking requests (affiliate fallback + optional API)
create table if not exists public.youtravel_booking_requests (
  id uuid primary key default gen_random_uuid(),
  tour_id bigint not null references public.youtravel_tours (id) on delete cascade,
  tour_slug text not null,
  user_id text,
  offer_id bigint,
  start_date date not null,
  end_date date,
  persons_count integer not null check (persons_count > 0),
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  message text,
  youtravel_order_id text,
  youtravel_order_url text,
  youtravel_status text,
  price_snapshot jsonb,
  created_at timestamptz not null default now()
);

create index if not exists youtravel_booking_requests_tour_id_idx
  on public.youtravel_booking_requests (tour_id);
create index if not exists youtravel_booking_requests_slug_idx
  on public.youtravel_booking_requests (tour_slug);
create index if not exists youtravel_booking_requests_created_at_idx
  on public.youtravel_booking_requests (created_at desc);

alter table public.youtravel_booking_requests enable row level security;

comment on table public.youtravel_booking_requests is 'On-site YouTravel.me booking attempts — affiliate fallback and optional partner API';
