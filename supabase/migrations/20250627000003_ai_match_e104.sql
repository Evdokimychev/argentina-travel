-- E104: AI tour matching sessions and analytics events

create table if not exists public.ai_match_sessions (
  id uuid primary key,
  user_id uuid references public.profiles (id) on delete set null,
  messages jsonb not null default '[]'::jsonb,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.ai_match_sessions is
  'Сессии диалогового подбора тура (E104): история сообщений и рекомендаций.';

create index if not exists ai_match_sessions_user_id_idx
  on public.ai_match_sessions (user_id)
  where user_id is not null;

create index if not exists ai_match_sessions_expires_at_idx
  on public.ai_match_sessions (expires_at);

alter table public.ai_match_sessions enable row level security;

drop policy if exists "ai_match_sessions_owner_select" on public.ai_match_sessions;
create policy "ai_match_sessions_owner_select"
  on public.ai_match_sessions
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "ai_match_sessions_service_all" on public.ai_match_sessions;
create policy "ai_match_sessions_service_all"
  on public.ai_match_sessions
  for all
  to service_role
  using (true)
  with check (true);

create table if not exists public.ai_match_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.ai_match_sessions (id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.ai_match_events is
  'Аналитика умного подбора тура (E104): запросы и выдача рекомендаций.';

create index if not exists ai_match_events_type_created_at_idx
  on public.ai_match_events (event_type, created_at desc);

create index if not exists ai_match_events_session_id_idx
  on public.ai_match_events (session_id)
  where session_id is not null;

alter table public.ai_match_events enable row level security;

drop policy if exists "ai_match_events_anon_insert" on public.ai_match_events;
create policy "ai_match_events_anon_insert"
  on public.ai_match_events
  for insert
  to anon, authenticated
  with check (event_type in ('match_query', 'match_result'));

drop policy if exists "ai_match_events_service_select" on public.ai_match_events;
create policy "ai_match_events_service_select"
  on public.ai_match_events
  for select
  to service_role
  using (true);
