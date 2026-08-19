-- Iteration 3: organizer application decisions are RPC-only.
-- Staff must not UPDATE rows directly (no audit, race-prone).

drop policy if exists "organizer_applications_update_staff" on public.organizer_applications;

revoke update on table public.organizer_applications from anon, authenticated;

comment on table public.organizer_applications is
  'Organizer applications. Applicants insert/select own rows; decisions only via admin_decide_organizer_application.';
