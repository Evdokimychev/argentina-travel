-- YouTravel booking request status sync timestamps
alter table public.youtravel_booking_requests
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists status_synced_at timestamptz;

create index if not exists youtravel_booking_requests_status_sync_idx
  on public.youtravel_booking_requests (status_synced_at desc nulls last)
  where youtravel_order_id is not null;
