-- Tripster on-site booking requests (External Orders API mirror)
create table if not exists public.tripster_booking_requests (
  id uuid primary key default gen_random_uuid(),
  experience_id integer not null references public.tripster_experiences (id) on delete cascade,
  experience_slug text not null,
  user_id text,
  event_date date not null,
  event_time text not null,
  persons_count integer not null check (persons_count > 0),
  tickets jsonb not null default '[]'::jsonb,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  message_to_guide text,
  tripster_order_id integer,
  tripster_order_url text,
  tripster_status text,
  price_snapshot jsonb,
  created_at timestamptz not null default now()
);

create index if not exists tripster_booking_requests_experience_id_idx
  on public.tripster_booking_requests (experience_id);
create index if not exists tripster_booking_requests_slug_idx
  on public.tripster_booking_requests (experience_slug);
create index if not exists tripster_booking_requests_created_at_idx
  on public.tripster_booking_requests (created_at desc);

alter table public.tripster_booking_requests enable row level security;

comment on table public.tripster_booking_requests is 'On-site Tripster booking attempts via External Orders API';
