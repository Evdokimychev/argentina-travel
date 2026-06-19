-- E95: GDPR automation — soft delete pipeline

alter table public.profiles
  add column if not exists deleted_at timestamptz,
  add column if not exists anonymized_at timestamptz;

comment on column public.profiles.deleted_at is
  'Timestamp when user requested or entered soft-delete state.';
comment on column public.profiles.anonymized_at is
  'Timestamp when profile and linked personal data were anonymized.';

create index if not exists profiles_deleted_at_idx
  on public.profiles (deleted_at desc)
  where deleted_at is not null;

create index if not exists profiles_anonymized_at_idx
  on public.profiles (anonymized_at desc)
  where anonymized_at is not null;

update public.privacy_requests
set status = 'approved'
where status = 'in_review';

alter table public.privacy_requests
  drop constraint if exists privacy_requests_status_check;

alter table public.privacy_requests
  add constraint privacy_requests_status_check
  check (status in ('pending', 'approved', 'processing', 'completed', 'rejected', 'failed'));

create index if not exists privacy_requests_approved_requested_at_idx
  on public.privacy_requests (requested_at asc)
  where status = 'approved';
