-- Minimal CRM workflow for contact submissions.
-- Prepared locally; apply only after staging verification.

-- Public forms write only through validated and rate-limited server routes.
drop policy if exists "newsletter_anon_insert" on public.newsletter_subscribers;
drop policy if exists "contact_anon_insert" on public.contact_submissions;
revoke insert on table public.newsletter_subscribers from anon, authenticated;
revoke insert on table public.contact_submissions from anon, authenticated;

alter table public.contact_submissions
  add column if not exists status text not null default 'new',
  add column if not exists assigned_to uuid references public.profiles (id) on delete set null,
  add column if not exists admin_notes text not null default '',
  add column if not exists next_action_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.contact_submissions
  drop constraint if exists contact_submissions_status_check;

alter table public.contact_submissions
  add constraint contact_submissions_status_check
  check (status in ('new', 'in_progress', 'waiting', 'resolved', 'spam'));

create index if not exists contact_submissions_status_created_at_idx
  on public.contact_submissions (status, created_at desc);

create index if not exists contact_submissions_next_action_idx
  on public.contact_submissions (next_action_at)
  where next_action_at is not null and status not in ('resolved', 'spam');

drop trigger if exists contact_submissions_set_updated_at on public.contact_submissions;
create trigger contact_submissions_set_updated_at
  before update on public.contact_submissions
  for each row execute function public.set_updated_at();
