-- Professional operating layer for the content factory.
-- This migration is intentionally server-only: authenticated administrators use
-- protected Next.js handlers and the service role is the only Data API role.

create table public.content_factory_campaigns (
  id uuid primary key default gen_random_uuid(),
  project_key text not null default 'argentina-travel'
    check (project_key ~ '^[a-z0-9][a-z0-9_-]{1,63}$'),
  name text not null check (char_length(trim(name)) between 2 and 160),
  objective text not null default '',
  audience text not null default '',
  content_pillars text[] not null default '{}',
  status text not null default 'draft'
    check (status in ('draft', 'active', 'paused', 'completed', 'archived')),
  starts_at timestamptz,
  ends_at timestamptz,
  target_metrics jsonb not null default '{}',
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create table public.content_factory_templates (
  id uuid primary key default gen_random_uuid(),
  project_key text not null default 'argentina-travel'
    check (project_key ~ '^[a-z0-9][a-z0-9_-]{1,63}$'),
  name text not null check (char_length(trim(name)) between 2 and 160),
  channel text not null check (channel in ('telegram', 'instagram', 'whatsapp')),
  format text not null check (format in ('post', 'carousel', 'reel', 'story', 'message', 'template')),
  content_pillar text,
  body_template text not null default '' check (char_length(body_template) <= 60000),
  default_options jsonb not null default '{}',
  active boolean not null default true,
  usage_count integer not null default 0 check (usage_count >= 0),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_key, channel, name)
);

create table public.content_factory_generation_runs (
  id uuid primary key default gen_random_uuid(),
  project_key text not null default 'argentina-travel',
  item_id uuid references public.content_factory_items(id) on delete set null,
  source_document_id text references public.content_documents(id) on delete set null,
  source_candidate_id uuid references public.ingestion_candidates(id) on delete set null,
  provider text not null default 'openai',
  model text not null,
  prompt_version text not null,
  status text not null default 'running'
    check (status in ('running', 'succeeded', 'failed', 'fallback')),
  requested_channels text[] not null default '{}',
  input_snapshot jsonb not null default '{}',
  output_snapshot jsonb not null default '{}',
  quality_report jsonb not null default '{}',
  input_tokens integer,
  output_tokens integer,
  latency_ms integer,
  error_code text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.content_factory_items
  add column campaign_id uuid references public.content_factory_campaigns(id) on delete set null,
  add column source_candidate_id uuid references public.ingestion_candidates(id) on delete set null,
  add column review_status text not null default 'not_requested'
    check (review_status in ('not_requested', 'requested', 'changes_requested', 'approved')),
  add column reviewer_id uuid references auth.users(id) on delete set null,
  add column review_notes text,
  add column approved_at timestamptz,
  add column due_at timestamptz;

alter table public.content_factory_variants
  add column headline text not null default '',
  add column alt_text text not null default '',
  add column hashtags text[] not null default '{}',
  add column first_comment text,
  add column review_status text not null default 'not_requested'
    check (review_status in ('not_requested', 'requested', 'changes_requested', 'approved')),
  add column generation_run_id uuid references public.content_factory_generation_runs(id) on delete set null;

alter table public.content_publication_jobs
  add column provider_delivery_status text,
  add column delivered_at timestamptz,
  add column read_at timestamptz;

alter table public.social_inbox_threads
  add column assigned_to uuid references auth.users(id) on delete set null,
  add column contact_submission_id uuid references public.contact_submissions(id) on delete set null,
  add column booking_id text references public.bookings(id) on delete set null,
  add column last_inbound_at timestamptz,
  add column last_outbound_at timestamptz;

create table public.content_factory_metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.content_factory_variants(id) on delete cascade,
  provider text not null check (provider in ('telegram', 'instagram', 'whatsapp')),
  captured_at timestamptz not null default now(),
  impressions bigint,
  reach bigint,
  reactions bigint,
  comments bigint,
  shares bigint,
  saves bigint,
  clicks bigint,
  replies bigint,
  followers_delta bigint,
  raw_metrics jsonb not null default '{}',
  unique (variant_id, captured_at)
);

create index content_factory_campaigns_status_idx
  on public.content_factory_campaigns (project_key, status, starts_at, ends_at);
create index content_factory_items_calendar_idx
  on public.content_factory_items (project_key, scheduled_at, due_at)
  where status <> 'archived';
create index content_factory_items_campaign_idx
  on public.content_factory_items (campaign_id, status, scheduled_at);
create index content_factory_generation_runs_item_idx
  on public.content_factory_generation_runs (item_id, created_at desc);
create index content_factory_metric_snapshots_variant_idx
  on public.content_factory_metric_snapshots (variant_id, captured_at desc);
create index social_inbox_threads_assignment_idx
  on public.social_inbox_threads (project_key, assigned_to, status, last_message_at desc);

create trigger content_factory_campaigns_touch_updated_at
  before update on public.content_factory_campaigns
  for each row execute function public.content_factory_touch_updated_at();
create trigger content_factory_templates_touch_updated_at
  before update on public.content_factory_templates
  for each row execute function public.content_factory_touch_updated_at();

alter table public.content_factory_campaigns enable row level security;
alter table public.content_factory_templates enable row level security;
alter table public.content_factory_generation_runs enable row level security;
alter table public.content_factory_metric_snapshots enable row level security;

create policy content_factory_campaigns_service_role_all
  on public.content_factory_campaigns for all to service_role using (true) with check (true);
create policy content_factory_templates_service_role_all
  on public.content_factory_templates for all to service_role using (true) with check (true);
create policy content_factory_generation_runs_service_role_all
  on public.content_factory_generation_runs for all to service_role using (true) with check (true);
create policy content_factory_metric_snapshots_service_role_all
  on public.content_factory_metric_snapshots for all to service_role using (true) with check (true);

revoke all on public.content_factory_campaigns from public, anon, authenticated;
revoke all on public.content_factory_templates from public, anon, authenticated;
revoke all on public.content_factory_generation_runs from public, anon, authenticated;
revoke all on public.content_factory_metric_snapshots from public, anon, authenticated;

grant select, insert, update, delete on public.content_factory_campaigns to service_role;
grant select, insert, update, delete on public.content_factory_templates to service_role;
grant select, insert, update, delete on public.content_factory_generation_runs to service_role;
grant select, insert, update, delete on public.content_factory_metric_snapshots to service_role;

comment on table public.content_factory_campaigns is
  'Editorial campaigns with goals, audience, dates and measurable targets.';
comment on table public.content_factory_templates is
  'Reusable channel-specific editorial templates; no provider credentials.';
comment on table public.content_factory_generation_runs is
  'Auditable AI generation ledger with prompt, model, usage and quality report.';
comment on table public.content_factory_metric_snapshots is
  'Time-series engagement metrics captured from official provider APIs or verified manual input.';
