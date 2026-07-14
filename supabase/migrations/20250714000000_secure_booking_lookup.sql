-- Guest booking lookup: short-lived OTP challenges and purpose-bound sessions.
-- Rollback: drop booking_lookup_audit_log, then booking_lookup_challenges.

create table if not exists public.booking_lookup_challenges (
  id uuid primary key default gen_random_uuid(),
  email_hash text not null,
  code_hash text not null,
  booking_ids text[] not null default '{}',
  expires_at timestamptz not null,
  attempts smallint not null default 0,
  max_attempts smallint not null default 5,
  consumed_at timestamptz,
  session_token_hash text,
  session_expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint booking_lookup_attempts_check check (attempts >= 0 and max_attempts between 1 and 10)
);

create index if not exists booking_lookup_email_created_idx
  on public.booking_lookup_challenges (email_hash, created_at desc);
create unique index if not exists booking_lookup_session_token_idx
  on public.booking_lookup_challenges (session_token_hash)
  where session_token_hash is not null;

create table if not exists public.booking_lookup_audit_log (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references public.booking_lookup_challenges (id) on delete set null,
  event text not null,
  ip_hash text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists booking_lookup_audit_created_idx
  on public.booking_lookup_audit_log (created_at desc);

alter table public.booking_lookup_challenges enable row level security;
alter table public.booking_lookup_audit_log enable row level security;

revoke all on public.booking_lookup_challenges from anon, authenticated, public;
revoke all on public.booking_lookup_audit_log from anon, authenticated, public;
grant select, insert, update, delete on public.booking_lookup_challenges to service_role;
grant select, insert on public.booking_lookup_audit_log to service_role;

comment on table public.booking_lookup_challenges is
  'Service-role-only OTP challenges for guest booking lookup; stores no plaintext email or code';
comment on table public.booking_lookup_audit_log is
  'PII-free security audit trail for guest booking lookup';
