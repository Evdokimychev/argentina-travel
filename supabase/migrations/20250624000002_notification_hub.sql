-- E46: Unified notifications hub — preferences, event log, in-app inbox
-- Apply via: npm run supabase:migrate

create table if not exists public.notification_preferences (
  user_id uuid not null references public.profiles (id) on delete cascade,
  channel text not null,
  category text not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, channel, category),
  constraint notification_preferences_channel_check
    check (channel in ('in_app', 'email')),
  constraint notification_preferences_category_check
    check (category in ('booking', 'payment', 'travelers', 'reviews', 'moderation', 'system'))
);

create index if not exists notification_preferences_user_idx
  on public.notification_preferences (user_id);

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  dedupe_key text not null,
  event_type text not null,
  category text not null,
  channel text not null,
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  constraint notification_events_channel_check
    check (channel in ('in_app', 'email')),
  constraint notification_events_category_check
    check (category in ('booking', 'payment', 'travelers', 'reviews', 'moderation', 'system'))
);

create unique index if not exists notification_events_dedupe_idx
  on public.notification_events (user_id, dedupe_key, channel);

create index if not exists notification_events_user_in_app_idx
  on public.notification_events (user_id, created_at desc)
  where channel = 'in_app';

create index if not exists notification_events_user_unread_idx
  on public.notification_events (user_id, created_at desc)
  where channel = 'in_app' and read_at is null;

alter table public.notification_preferences enable row level security;
alter table public.notification_events enable row level security;

drop policy if exists "notification_preferences_select_own" on public.notification_preferences;
create policy "notification_preferences_select_own"
  on public.notification_preferences for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "notification_preferences_insert_own" on public.notification_preferences;
create policy "notification_preferences_insert_own"
  on public.notification_preferences for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "notification_preferences_update_own" on public.notification_preferences;
create policy "notification_preferences_update_own"
  on public.notification_preferences for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "notification_events_select_own" on public.notification_events;
create policy "notification_events_select_own"
  on public.notification_events for select
  to authenticated
  using (user_id = auth.uid() and channel = 'in_app');

drop policy if exists "notification_events_update_own" on public.notification_events;
create policy "notification_events_update_own"
  on public.notification_events for update
  to authenticated
  using (user_id = auth.uid() and channel = 'in_app')
  with check (user_id = auth.uid() and channel = 'in_app');

comment on table public.notification_preferences is 'Per-user notification channel/category toggles';
comment on table public.notification_events is 'Notification delivery log with dedupe; in_app rows power the unified bell';
