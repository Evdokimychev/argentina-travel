-- E75: Lightweight API key usage log for partner portal stats

create table if not exists public.api_key_usage_log (
  id bigserial primary key,
  key_id uuid not null references public.api_keys (id) on delete cascade,
  endpoint text not null,
  ts timestamptz not null default now(),
  status smallint not null check (status between 100 and 599)
);

create index if not exists api_key_usage_log_key_ts_idx
  on public.api_key_usage_log (key_id, ts desc);

create index if not exists api_key_usage_log_ts_idx
  on public.api_key_usage_log (ts desc);

alter table public.api_key_usage_log enable row level security;

comment on table public.api_key_usage_log is 'Public API request log — writes via service role only';
