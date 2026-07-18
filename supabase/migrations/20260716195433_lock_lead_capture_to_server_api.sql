-- Lead capture is accepted only through validated, rate-limited server routes.
-- Direct Data API inserts bypass /api/newsletter and /api/contact controls.

drop policy if exists "newsletter_anon_insert" on public.newsletter_subscribers;
drop policy if exists "contact_anon_insert" on public.contact_submissions;

revoke insert on table public.newsletter_subscribers from anon, authenticated;
revoke insert on table public.contact_submissions from anon, authenticated;

grant select, insert, update, delete on table public.newsletter_subscribers to service_role;
grant select, insert, update, delete on table public.contact_submissions to service_role;

comment on table public.newsletter_subscribers is
  'Newsletter subscriptions; writes are accepted only through the rate-limited server API.';
comment on table public.contact_submissions is
  'Contact inbox; writes are accepted only through the validated, rate-limited server API.';
