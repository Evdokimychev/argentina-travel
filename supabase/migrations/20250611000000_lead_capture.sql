-- Minimal lead capture schema for «Пора в Аргентину»
-- Apply via Supabase Dashboard → SQL, or: supabase db push (with linked project)

-- ---------------------------------------------------------------------------
-- Newsletter
-- ---------------------------------------------------------------------------
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  locale text,
  source text not null default 'footer',
  status text not null default 'active' check (status in ('active', 'unsubscribed')),
  created_at timestamptz not null default now(),
  constraint newsletter_subscribers_email_unique unique (email)
);

comment on table public.newsletter_subscribers is
  'Footer and future newsletter signup forms';

-- ---------------------------------------------------------------------------
-- Contact / consultation / feedback / organizer applications
-- ---------------------------------------------------------------------------
create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (
    kind in (
      'general',
      'tour_inquiry',
      'service_request',
      'product_inquiry',
      'organizer_application',
      'consultation'
    )
  ),
  name text not null,
  email text,
  phone text,
  message text not null default '',
  context jsonb not null default '{}'::jsonb,
  page_url text,
  created_at timestamptz not null default now()
);

comment on table public.contact_submissions is
  'Unified inbox: contacts page, service requests, tour questions, organizer join form';

create index if not exists contact_submissions_kind_created_at_idx
  on public.contact_submissions (kind, created_at desc);

create index if not exists contact_submissions_created_at_idx
  on public.contact_submissions (created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security — anonymous insert only, no public reads
-- ---------------------------------------------------------------------------
alter table public.newsletter_subscribers enable row level security;
alter table public.contact_submissions enable row level security;

drop policy if exists "newsletter_anon_insert" on public.newsletter_subscribers;
create policy "newsletter_anon_insert"
  on public.newsletter_subscribers
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "contact_anon_insert" on public.contact_submissions;
create policy "contact_anon_insert"
  on public.contact_submissions
  for insert
  to anon, authenticated
  with check (true);

-- Staff reads via service role or future admin role policies
