-- Durable operations truth for scheduled jobs and actionable tour waitlist.

create table if not exists public.ops_cron_runs (
  id uuid primary key default gen_random_uuid(),
  route text not null,
  scheduled_at timestamptz,
  started_at timestamptz not null,
  finished_at timestamptz not null,
  status text not null check (status in ('succeeded', 'failed')),
  status_code integer,
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  message text not null,
  error_fingerprint text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ops_cron_runs_route_finished_idx
  on public.ops_cron_runs (route, finished_at desc);
create index if not exists ops_cron_runs_failed_idx
  on public.ops_cron_runs (finished_at desc)
  where status = 'failed';

alter table public.ops_cron_runs enable row level security;
revoke all on public.ops_cron_runs from anon, authenticated;
grant select, insert, update, delete on public.ops_cron_runs to service_role;

drop policy if exists "Ops cron runs are service role only" on public.ops_cron_runs;
create policy "Ops cron runs are service role only"
  on public.ops_cron_runs for all to public using (false) with check (false);

comment on table public.ops_cron_runs is
  'Durable, service-role-only history of scheduled route outcomes. Never stores request bodies or PII.';

-- Browser events must pass through the allowlisted, rate-limited server route.
drop policy if exists "analytics_events_anon_insert" on public.analytics_events;
revoke insert on public.analytics_events from anon, authenticated;
grant insert on public.analytics_events to service_role;
alter table public.analytics_events add column if not exists event_id text;
create unique index if not exists analytics_events_event_id_unique_idx
  on public.analytics_events (event_id) where event_id is not null;
comment on column public.analytics_events.event_id is
  'PII-free idempotency key produced by the controlled server ingestion route.';

alter table public.tour_waitlist_entries
  add column if not exists assigned_to uuid references public.profiles (id) on delete set null,
  add column if not exists converted_booking_id uuid references public.bookings (id) on delete set null,
  add column if not exists version integer not null default 1 check (version > 0),
  add column if not exists contacted_at timestamptz,
  add column if not exists closed_at timestamptz;

alter table public.tour_waitlist_entries
  drop constraint if exists tour_waitlist_entries_status_check;
alter table public.tour_waitlist_entries
  add constraint tour_waitlist_entries_status_check
  check (status in ('waiting', 'contacted', 'offered', 'converted', 'closed', 'cancelled'));

create index if not exists tour_waitlist_entries_assignee_status_idx
  on public.tour_waitlist_entries (assigned_to, status, created_at desc);
create index if not exists tour_waitlist_entries_converted_booking_idx
  on public.tour_waitlist_entries (converted_booking_id)
  where converted_booking_id is not null;

create or replace function public.admin_transition_waitlist_entry(
  p_entry_id uuid,
  p_expected_version integer,
  p_next_status text,
  p_assigned_to uuid default null,
  p_note text default null,
  p_booking_id uuid default null
)
returns public.tour_waitlist_entries
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_current public.tour_waitlist_entries;
  v_result public.tour_waitlist_entries;
begin
  select * into v_current
  from public.tour_waitlist_entries
  where id = p_entry_id
  for update;

  if v_current.id is null then raise exception 'waitlist_not_found'; end if;
  if v_current.version <> p_expected_version then raise exception 'waitlist_version_conflict'; end if;
  if p_next_status not in ('waiting', 'contacted', 'offered', 'converted', 'closed', 'cancelled') then
    raise exception 'invalid_waitlist_status';
  end if;
  if p_next_status = 'converted' and p_booking_id is null then
    raise exception 'converted_booking_required';
  end if;
  if not (
    (v_current.status = 'waiting' and p_next_status in ('waiting', 'contacted', 'cancelled', 'closed')) or
    (v_current.status = 'contacted' and p_next_status in ('contacted', 'offered', 'cancelled', 'closed')) or
    (v_current.status = 'offered' and p_next_status in ('offered', 'converted', 'contacted', 'cancelled', 'closed')) or
    (v_current.status in ('converted', 'closed', 'cancelled') and p_next_status = v_current.status)
  ) then
    raise exception 'invalid_waitlist_transition';
  end if;

  update public.tour_waitlist_entries
  set status = p_next_status,
      assigned_to = coalesce(p_assigned_to, assigned_to),
      note = coalesce(nullif(trim(p_note), ''), note),
      converted_booking_id = case when p_next_status = 'converted' then p_booking_id else converted_booking_id end,
      contacted_at = case when p_next_status in ('contacted', 'offered', 'converted') then coalesce(contacted_at, now()) else contacted_at end,
      closed_at = case when p_next_status in ('converted', 'closed', 'cancelled') then coalesce(closed_at, now()) else null end,
      version = version + 1
  where id = p_entry_id and version = p_expected_version
  returning * into v_result;

  if v_result.id is null then raise exception 'waitlist_version_conflict'; end if;
  return v_result;
end;
$$;

revoke all on function public.admin_transition_waitlist_entry(uuid, integer, text, uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.admin_transition_waitlist_entry(uuid, integer, text, uuid, text, uuid) to service_role;
