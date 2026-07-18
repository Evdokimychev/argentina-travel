-- Production waitlist workflow for organizer cabinet.
-- Prepared locally; apply only after staging verification.

alter table public.tour_waitlist_entries
  add column if not exists status_history jsonb not null default '[]'::jsonb,
  add column if not exists organizer_comments jsonb not null default '[]'::jsonb,
  add column if not exists converted_booking_id text references public.bookings (id) on delete set null;

alter table public.tour_waitlist_entries
  drop constraint if exists tour_waitlist_entries_status_check;

alter table public.tour_waitlist_entries
  add constraint tour_waitlist_entries_status_check
  check (status in ('waiting', 'contacted', 'offered', 'converted', 'cancelled', 'declined'));

update public.tour_waitlist_entries
set status_history = jsonb_build_array(
  jsonb_build_object(
    'id', 'initial-' || id::text,
    'from', null,
    'to', status,
    'changedAt', created_at,
    'changedBy', 'system'
  )
)
where status_history = '[]'::jsonb;
