-- E67: Realtime inbox v2 — read receipts and typing presence
-- Apply via: npm run supabase:migrate

-- ---------------------------------------------------------------------------
-- Read receipts (counterpart marks message as read)
-- ---------------------------------------------------------------------------
create table if not exists public.message_reads (
  user_id uuid not null references auth.users (id) on delete cascade,
  message_id uuid not null references public.conversation_messages (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (user_id, message_id)
);

create index if not exists message_reads_message_idx
  on public.message_reads (message_id);

comment on table public.message_reads is 'Per-user read markers for conversation messages';

-- ---------------------------------------------------------------------------
-- Typing presence (ephemeral; stale rows should be purged periodically)
-- ---------------------------------------------------------------------------
create table if not exists public.typing_presence (
  thread_id uuid not null references public.conversation_threads (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  updated_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);

create index if not exists typing_presence_thread_updated_idx
  on public.typing_presence (thread_id, updated_at desc);

comment on table public.typing_presence is
  'Ephemeral typing indicators per thread participant. '
  'TTL: delete rows where updated_at < now() - interval ''15 seconds'' '
  '(recommended pg_cron every minute or application-side expiry on read).';

-- ---------------------------------------------------------------------------
-- Realtime: read receipts and typing stream to subscribed clients
-- ---------------------------------------------------------------------------
alter table public.message_reads replica identity full;
alter table public.typing_presence replica identity full;

do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    alter publication supabase_realtime add table public.message_reads;
    alter publication supabase_realtime add table public.typing_presence;
  end if;
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.message_reads enable row level security;
alter table public.typing_presence enable row level security;

-- message_reads: participants see reads in their threads; users write only own reads
drop policy if exists "message_reads_select_participant" on public.message_reads;
create policy "message_reads_select_participant"
  on public.message_reads for select
  to authenticated
  using (
    exists (
      select 1
      from public.conversation_messages m
      join public.conversation_threads t on t.id = m.thread_id
      where m.id = message_reads.message_id
        and (
          t.tourist_user_id = auth.uid()
          or t.organizer_user_id = auth.uid()
          or public.is_admin_with('dashboard.view')
        )
    )
  );

drop policy if exists "message_reads_insert_own" on public.message_reads;
create policy "message_reads_insert_own"
  on public.message_reads for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.conversation_messages m
      join public.conversation_threads t on t.id = m.thread_id
      where m.id = message_reads.message_id
        and m.sender_id <> auth.uid()
        and (t.tourist_user_id = auth.uid() or t.organizer_user_id = auth.uid())
    )
  );

drop policy if exists "message_reads_update_own" on public.message_reads;
create policy "message_reads_update_own"
  on public.message_reads for update
  to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.conversation_messages m
      join public.conversation_threads t on t.id = m.thread_id
      where m.id = message_reads.message_id
        and m.sender_id <> auth.uid()
        and (t.tourist_user_id = auth.uid() or t.organizer_user_id = auth.uid())
    )
  );

-- typing_presence: participants read thread typing; users manage only own row
drop policy if exists "typing_presence_select_participant" on public.typing_presence;
create policy "typing_presence_select_participant"
  on public.typing_presence for select
  to authenticated
  using (
    exists (
      select 1
      from public.conversation_threads t
      where t.id = typing_presence.thread_id
        and (
          t.tourist_user_id = auth.uid()
          or t.organizer_user_id = auth.uid()
          or public.is_admin_with('dashboard.view')
        )
    )
  );

drop policy if exists "typing_presence_insert_own" on public.typing_presence;
create policy "typing_presence_insert_own"
  on public.typing_presence for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.conversation_threads t
      where t.id = thread_id
        and (t.tourist_user_id = auth.uid() or t.organizer_user_id = auth.uid())
    )
  );

drop policy if exists "typing_presence_update_own" on public.typing_presence;
create policy "typing_presence_update_own"
  on public.typing_presence for update
  to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.conversation_threads t
      where t.id = thread_id
        and (t.tourist_user_id = auth.uid() or t.organizer_user_id = auth.uid())
    )
  );

drop policy if exists "typing_presence_delete_own" on public.typing_presence;
create policy "typing_presence_delete_own"
  on public.typing_presence for delete
  to authenticated
  using (user_id = auth.uid());
