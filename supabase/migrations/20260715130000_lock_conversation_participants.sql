-- Conversation participants are derived by trusted server code after checking
-- booking ownership or an expert inquiry. Authenticated clients may not create
-- or mutate participant rows directly through the Data API.
drop policy if exists "conversation_threads_insert_participant"
  on public.conversation_threads;
drop policy if exists "conversation_threads_update_participant"
  on public.conversation_threads;

revoke insert, update, delete on public.conversation_threads from authenticated;
grant select on public.conversation_threads to authenticated;

comment on table public.conversation_threads is
  'Server-created booking/expert conversations; participant columns are immutable to clients.';
