-- E36: Organizer CRM unified inbox — read state per user/item
-- Apply via: npm run supabase:migrate

create table if not exists public.organizer_inbox_reads (
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_key text not null,
  read_at timestamptz not null default now(),
  primary key (user_id, item_key)
);

create index if not exists organizer_inbox_reads_user_idx
  on public.organizer_inbox_reads (user_id, read_at desc);

alter table public.organizer_inbox_reads enable row level security;

drop policy if exists "organizer_inbox_reads_select_own" on public.organizer_inbox_reads;
create policy "organizer_inbox_reads_select_own"
  on public.organizer_inbox_reads for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "organizer_inbox_reads_insert_own" on public.organizer_inbox_reads;
create policy "organizer_inbox_reads_insert_own"
  on public.organizer_inbox_reads for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "organizer_inbox_reads_update_own" on public.organizer_inbox_reads;
create policy "organizer_inbox_reads_update_own"
  on public.organizer_inbox_reads for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Organizers may read moderation queue rows for their own tours
drop policy if exists "moderation_queue_select_organizer_tour" on public.moderation_queue;
create policy "moderation_queue_select_organizer_tour"
  on public.moderation_queue for select
  to authenticated
  using (
    entity_type = 'tour'
    and exists (
      select 1
      from public.tours t
      where t.id = entity_id
        and t.owner_user_id = auth.uid()::text
    )
  );

comment on table public.organizer_inbox_reads is 'Read markers for organizer unified inbox items';
