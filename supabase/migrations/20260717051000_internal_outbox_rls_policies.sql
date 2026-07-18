-- Make the server-only boundary explicit for internal operation ledgers and outboxes.
-- The service role bypasses RLS; every browser-facing role is denied by policy.

drop policy if exists "CMS import operations are service role only"
  on public.cms_import_operations;
create policy "CMS import operations are service role only"
  on public.cms_import_operations
  for all
  to public
  using (false)
  with check (false);

drop policy if exists "CMS search outbox is service role only"
  on public.cms_search_outbox;
create policy "CMS search outbox is service role only"
  on public.cms_search_outbox
  for all
  to public
  using (false)
  with check (false);

drop policy if exists "Moderation delivery outbox is service role only"
  on public.moderation_delivery_outbox;
create policy "Moderation delivery outbox is service role only"
  on public.moderation_delivery_outbox
  for all
  to public
  using (false)
  with check (false);

drop policy if exists "Operations transition outbox is service role only"
  on public.operations_transition_outbox;
create policy "Operations transition outbox is service role only"
  on public.operations_transition_outbox
  for all
  to public
  using (false)
  with check (false);

comment on table public.cms_import_operations is
  'Internal CMS import idempotency ledger; service role only.';
comment on table public.cms_search_outbox is
  'Internal CMS search synchronization outbox; service role only.';
comment on table public.moderation_delivery_outbox is
  'Internal moderation delivery outbox; service role only.';
comment on table public.operations_transition_outbox is
  'Internal booking and shop transition outbox; service role only.';
