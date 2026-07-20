-- Historical production baselines may have journaled the operations migration
-- before this runtime table existed. Restore the durable cron truth narrowly.

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
revoke all on public.ops_cron_runs from public, anon, authenticated;
grant select, insert, update, delete on public.ops_cron_runs to service_role;

drop policy if exists "Ops cron runs are service role only" on public.ops_cron_runs;
create policy "Ops cron runs are service role only"
  on public.ops_cron_runs for all to public using (false) with check (false);

comment on table public.ops_cron_runs is
  'Durable, service-role-only history of scheduled route outcomes. Never stores request bodies or PII.';
