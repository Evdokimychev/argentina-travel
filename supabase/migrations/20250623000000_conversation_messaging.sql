-- E37: Realtime messaging foundation — threads and messages per booking
-- Apply via: npm run supabase:migrate

-- ---------------------------------------------------------------------------
-- Conversation threads (one per booking)
-- ---------------------------------------------------------------------------
create table if not exists public.conversation_threads (
  id uuid primary key default gen_random_uuid(),
  booking_id text not null references public.bookings (id) on delete cascade,
  tourist_user_id uuid not null references auth.users (id) on delete cascade,
  organizer_user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversation_threads_booking_id_key unique (booking_id),
  constraint conversation_threads_participants_distinct check (
    tourist_user_id <> organizer_user_id
  )
);

create index if not exists conversation_threads_tourist_idx
  on public.conversation_threads (tourist_user_id);
create index if not exists conversation_threads_organizer_idx
  on public.conversation_threads (organizer_user_id);
create index if not exists conversation_threads_updated_at_idx
  on public.conversation_threads (updated_at desc);

comment on table public.conversation_threads is 'Booking-scoped chat thread between tourist and organizer';

-- ---------------------------------------------------------------------------
-- Messages
-- ---------------------------------------------------------------------------
create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.conversation_threads (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint conversation_messages_body_check check (
    char_length(trim(body)) > 0 and char_length(body) <= 4000
  )
);

create index if not exists conversation_messages_thread_created_idx
  on public.conversation_messages (thread_id, created_at);

comment on table public.conversation_messages is 'Messages in a booking conversation thread';

-- Keep thread.updated_at in sync with latest message
create or replace function public.touch_conversation_thread_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversation_threads
  set updated_at = new.created_at
  where id = new.thread_id;
  return new;
end;
$$;

drop trigger if exists conversation_messages_touch_thread on public.conversation_messages;
create trigger conversation_messages_touch_thread
  after insert on public.conversation_messages
  for each row execute function public.touch_conversation_thread_on_message();

drop trigger if exists conversation_threads_set_updated_at on public.conversation_threads;
create trigger conversation_threads_set_updated_at
  before update on public.conversation_threads
  for each row execute function public.set_updated_at();

-- Realtime: new messages stream to subscribed clients
alter table public.conversation_messages replica identity full;

do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    alter publication supabase_realtime add table public.conversation_messages;
  end if;
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.conversation_threads enable row level security;
alter table public.conversation_messages enable row level security;

-- Threads: participants read/write; admin read for moderation
drop policy if exists "conversation_threads_select_participant" on public.conversation_threads;
create policy "conversation_threads_select_participant"
  on public.conversation_threads for select
  to authenticated
  using (
    tourist_user_id = auth.uid()
    or organizer_user_id = auth.uid()
    or public.is_admin_with('dashboard.view')
  );

drop policy if exists "conversation_threads_insert_participant" on public.conversation_threads;
create policy "conversation_threads_insert_participant"
  on public.conversation_threads for insert
  to authenticated
  with check (
    tourist_user_id = auth.uid()
    or organizer_user_id = auth.uid()
  );

drop policy if exists "conversation_threads_update_participant" on public.conversation_threads;
create policy "conversation_threads_update_participant"
  on public.conversation_threads for update
  to authenticated
  using (
    tourist_user_id = auth.uid()
    or organizer_user_id = auth.uid()
  )
  with check (
    tourist_user_id = auth.uid()
    or organizer_user_id = auth.uid()
  );

-- Messages: participants read/write; admin read
drop policy if exists "conversation_messages_select_participant" on public.conversation_messages;
create policy "conversation_messages_select_participant"
  on public.conversation_messages for select
  to authenticated
  using (
    exists (
      select 1
      from public.conversation_threads t
      where t.id = conversation_messages.thread_id
        and (
          t.tourist_user_id = auth.uid()
          or t.organizer_user_id = auth.uid()
          or public.is_admin_with('dashboard.view')
        )
    )
  );

drop policy if exists "conversation_messages_insert_participant" on public.conversation_messages;
create policy "conversation_messages_insert_participant"
  on public.conversation_messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from public.conversation_threads t
      where t.id = thread_id
        and (t.tourist_user_id = auth.uid() or t.organizer_user_id = auth.uid())
    )
  );
