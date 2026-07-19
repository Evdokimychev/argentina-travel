-- Native ingestion control plane. All operational rows are service-role only;
-- authenticated staff use capability-checked server routes.

create table if not exists public.ingestion_sources (
  id uuid primary key default gen_random_uuid(),
  legacy_key text unique,
  name text not null,
  source_type text not null,
  status text not null default 'draft',
  description text,
  language text not null default 'ru',
  region text,
  categories text[] not null default '{}',
  connection_config jsonb not null default '{}',
  credential_ref text,
  schedule_kind text not null default 'manual',
  schedule_expression text,
  enabled boolean not null default false,
  priority integer not null default 50,
  trust_level integer not null default 50,
  legal_notes text,
  rate_limit_per_minute integer not null default 30,
  retry_policy jsonb not null default '{"maxAttempts":3,"baseDelaySeconds":60,"maxDelaySeconds":3600}',
  timeout_seconds integer not null default 30,
  checkpoint jsonb not null default '{}',
  owner_user_id uuid references public.profiles (id) on delete set null,
  last_run_at timestamptz,
  last_success_at timestamptz,
  next_run_at timestamptz,
  last_error text,
  last_tested_at timestamptz,
  last_test_ok boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ingestion_sources_type_check check (
    source_type in ('telegram', 'website', 'rss', 'sitemap', 'json_api', 'youtube', 'manual')
  ),
  constraint ingestion_sources_status_check check (
    status in ('draft', 'active', 'paused', 'degraded', 'failed', 'disabled', 'archived')
  ),
  constraint ingestion_sources_schedule_check check (
    schedule_kind in ('manual', 'cron', 'interval', 'webhook')
  ),
  constraint ingestion_sources_priority_check check (priority between 0 and 100),
  constraint ingestion_sources_trust_check check (trust_level between 0 and 100),
  constraint ingestion_sources_rate_limit_check check (rate_limit_per_minute between 1 and 600),
  constraint ingestion_sources_timeout_check check (timeout_seconds between 5 and 300),
  constraint ingestion_sources_credential_ref_check check (
    credential_ref is null or credential_ref ~ '^[A-Z][A-Z0-9_]{2,80}$'
  )
);

create table if not exists public.ingestion_source_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.ingestion_sources (id) on delete cascade,
  trigger_kind text not null default 'manual',
  status text not null default 'pending',
  idempotency_key text not null unique,
  retry_of_run_id uuid references public.ingestion_source_runs (id) on delete set null,
  attempt integer not null default 1,
  max_attempts integer not null default 3,
  next_retry_at timestamptz,
  dead_lettered_at timestamptz,
  actor_user_id uuid references public.profiles (id) on delete set null,
  checkpoint_before jsonb not null default '{}',
  checkpoint_after jsonb not null default '{}',
  counts jsonb not null default '{}',
  error_category text,
  error_message text,
  cancel_requested_at timestamptz,
  heartbeat_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint ingestion_source_runs_trigger_check check (
    trigger_kind in ('manual', 'cron', 'interval', 'webhook', 'retry', 'migration', 'shadow')
  ),
  constraint ingestion_source_runs_status_check check (
    status in (
      'pending', 'fetching', 'fetched', 'normalizing', 'processing',
      'awaiting_moderation', 'approved', 'rejected', 'publishing',
      'published', 'succeeded', 'partial', 'failed', 'cancelled', 'archived'
    )
  ),
  constraint ingestion_source_runs_attempt_check check (attempt > 0 and max_attempts > 0 and attempt <= max_attempts)
);

create unique index if not exists ingestion_source_runs_one_active_idx
  on public.ingestion_source_runs (source_id)
  where status in ('pending', 'fetching', 'fetched', 'normalizing', 'processing', 'publishing');

create table if not exists public.ingestion_raw_documents (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.ingestion_sources (id) on delete restrict,
  source_run_id uuid not null references public.ingestion_source_runs (id) on delete restrict,
  parent_document_id uuid references public.ingestion_raw_documents (id) on delete set null,
  external_id text not null,
  version integer not null default 1,
  source_url text,
  canonical_url text,
  raw_format text not null,
  raw_content text,
  raw_payload jsonb not null default '{}',
  content_hash text not null,
  media jsonb not null default '[]',
  title text,
  author text,
  language text,
  source_published_at timestamptz,
  source_updated_at timestamptz,
  fetched_at timestamptz not null default now(),
  status text not null default 'fetched',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  constraint ingestion_raw_documents_format_check check (
    raw_format in ('telegram', 'html', 'rss', 'atom', 'json', 'youtube', 'text', 'markdown')
  ),
  constraint ingestion_raw_documents_status_check check (
    status in ('pending', 'fetching', 'fetched', 'normalizing', 'processing', 'awaiting_moderation', 'failed', 'archived')
  ),
  constraint ingestion_raw_documents_version_check check (version > 0),
  constraint ingestion_raw_documents_identity_unique unique (source_id, external_id, content_hash)
);

create table if not exists public.ingestion_normalized_documents (
  id uuid primary key default gen_random_uuid(),
  raw_document_id uuid not null unique references public.ingestion_raw_documents (id) on delete cascade,
  source_id uuid not null references public.ingestion_sources (id) on delete restrict,
  source_run_id uuid not null references public.ingestion_source_runs (id) on delete restrict,
  title text not null,
  body text not null,
  summary text not null default '',
  language text not null default 'ru',
  category text,
  province text,
  city text,
  tags text[] not null default '{}',
  fingerprint text not null,
  metadata jsonb not null default '{}',
  normalized_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.ingestion_candidates (
  id uuid primary key default gen_random_uuid(),
  normalized_document_id uuid not null unique references public.ingestion_normalized_documents (id) on delete cascade,
  source_id uuid not null references public.ingestion_sources (id) on delete restrict,
  source_run_id uuid not null references public.ingestion_source_runs (id) on delete restrict,
  status text not null default 'awaiting_moderation',
  title text not null,
  summary text not null default '',
  processed_content text not null,
  language text not null default 'ru',
  category text,
  province text,
  city text,
  tags text[] not null default '{}',
  quality_score integer not null default 0,
  freshness_score integer not null default 0,
  trust_score integer not null default 0,
  decision_reasons text[] not null default '{}',
  flags text[] not null default '{}',
  extracted_entities jsonb not null default '[]',
  suggested_target text not null default 'knowledge',
  ai_result jsonb,
  ai_prompt_version text,
  ai_model text,
  ai_latency_ms integer,
  ai_input_tokens integer,
  ai_output_tokens integer,
  assigned_to uuid references public.profiles (id) on delete set null,
  moderation_notes text,
  moderated_by uuid references public.profiles (id) on delete set null,
  moderated_at timestamptz,
  cms_document_id text references public.content_documents (id) on delete set null,
  publication_target text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ingestion_candidates_status_check check (
    status in ('awaiting_moderation', 'approved', 'rejected', 'deferred', 'reprocess', 'duplicate', 'publishing', 'published', 'archived')
  ),
  constraint ingestion_candidates_score_check check (
    quality_score between 0 and 100 and freshness_score between 0 and 100 and trust_score between 0 and 100
  ),
  constraint ingestion_candidates_target_check check (
    suggested_target in ('knowledge', 'blog', 'news', 'place', 'city', 'region', 'route', 'map', 'event', 'warning', 'immigration', 'source_only')
  )
);

create table if not exists public.ingestion_duplicate_links (
  candidate_id uuid not null references public.ingestion_candidates (id) on delete cascade,
  related_candidate_id uuid not null references public.ingestion_candidates (id) on delete cascade,
  relation_type text not null,
  similarity numeric(5,4) not null default 1 check (similarity between 0 and 1),
  resolution text not null default 'pending',
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (candidate_id, related_candidate_id),
  constraint ingestion_duplicate_links_no_self_check check (candidate_id <> related_candidate_id),
  constraint ingestion_duplicate_links_type_check check (
    relation_type in ('exact', 'near', 'updated_version', 'related', 'conflicting')
  ),
  constraint ingestion_duplicate_links_resolution_check check (
    resolution in ('pending', 'merge', 'keep_primary', 'keep_both', 'as_update', 'rejected', 'related')
  )
);

create table if not exists public.ingestion_processing_steps (
  id uuid primary key default gen_random_uuid(),
  source_run_id uuid not null references public.ingestion_source_runs (id) on delete cascade,
  raw_document_id uuid references public.ingestion_raw_documents (id) on delete cascade,
  candidate_id uuid references public.ingestion_candidates (id) on delete cascade,
  step_name text not null,
  status text not null default 'pending',
  attempt integer not null default 1,
  max_attempts integer not null default 3,
  input_summary jsonb not null default '{}',
  output_summary jsonb not null default '{}',
  error_category text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  latency_ms integer,
  created_at timestamptz not null default now(),
  constraint ingestion_processing_steps_name_check check (
    step_name in (
      'fetch', 'persist_raw', 'normalize', 'clean', 'language', 'metadata',
      'geography', 'deduplicate', 'classify', 'quality', 'freshness',
      'ai', 'candidate', 'moderation', 'publish', 'index'
    )
  ),
  constraint ingestion_processing_steps_status_check check (
    status in ('pending', 'running', 'succeeded', 'failed', 'skipped', 'cancelled')
  ),
  constraint ingestion_processing_steps_attempt_check check (attempt > 0 and max_attempts > 0)
);

create table if not exists public.ingestion_prompt_versions (
  id text primary key,
  task text not null,
  version integer not null,
  provider text not null default 'openai',
  model text not null,
  system_prompt text not null,
  output_schema jsonb not null default '{}',
  status text not null default 'draft',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  constraint ingestion_prompt_versions_status_check check (status in ('draft', 'active', 'retired')),
  constraint ingestion_prompt_versions_task_version_unique unique (task, version)
);

create unique index if not exists ingestion_prompt_versions_one_active_idx
  on public.ingestion_prompt_versions (task) where status = 'active';

create table if not exists public.ingestion_migration_ledger (
  id uuid primary key default gen_random_uuid(),
  migration_id text not null,
  source_system text not null,
  entity_type text not null,
  legacy_id text not null,
  target_table text,
  target_id text,
  checksum text not null,
  status text not null default 'migrated',
  error_message text,
  migrated_at timestamptz not null default now(),
  constraint ingestion_migration_ledger_status_check check (status in ('migrated', 'skipped', 'failed', 'verified')),
  constraint ingestion_migration_ledger_identity_unique unique (source_system, entity_type, legacy_id)
);

create index if not exists ingestion_sources_due_idx
  on public.ingestion_sources (enabled, status, next_run_at, priority desc);
create index if not exists ingestion_source_runs_source_created_idx
  on public.ingestion_source_runs (source_id, created_at desc);
create index if not exists ingestion_source_runs_status_heartbeat_idx
  on public.ingestion_source_runs (status, heartbeat_at);
create index if not exists ingestion_source_runs_retry_idx
  on public.ingestion_source_runs (next_retry_at, attempt) where status = 'failed' and dead_lettered_at is null;
create index if not exists ingestion_raw_documents_source_external_idx
  on public.ingestion_raw_documents (source_id, external_id, version desc);
create index if not exists ingestion_raw_documents_hash_idx
  on public.ingestion_raw_documents (content_hash);
create index if not exists ingestion_normalized_documents_fingerprint_idx
  on public.ingestion_normalized_documents (fingerprint);
create index if not exists ingestion_candidates_queue_idx
  on public.ingestion_candidates (status, quality_score desc, created_at);
create index if not exists ingestion_candidates_location_idx
  on public.ingestion_candidates (province, city, status);
create index if not exists ingestion_processing_steps_run_idx
  on public.ingestion_processing_steps (source_run_id, created_at);
create index if not exists ingestion_processing_steps_retry_idx
  on public.ingestion_processing_steps (status, attempt, created_at) where status = 'failed';

drop trigger if exists ingestion_sources_set_updated_at on public.ingestion_sources;
create trigger ingestion_sources_set_updated_at before update on public.ingestion_sources
  for each row execute function public.set_updated_at();
drop trigger if exists ingestion_candidates_set_updated_at on public.ingestion_candidates;
create trigger ingestion_candidates_set_updated_at before update on public.ingestion_candidates
  for each row execute function public.set_updated_at();

alter table public.ingestion_sources enable row level security;
alter table public.ingestion_source_runs enable row level security;
alter table public.ingestion_raw_documents enable row level security;
alter table public.ingestion_normalized_documents enable row level security;
alter table public.ingestion_candidates enable row level security;
alter table public.ingestion_duplicate_links enable row level security;
alter table public.ingestion_processing_steps enable row level security;
alter table public.ingestion_prompt_versions enable row level security;
alter table public.ingestion_migration_ledger enable row level security;

create policy ingestion_sources_service_role_all
  on public.ingestion_sources for all to service_role using (true) with check (true);
create policy ingestion_source_runs_service_role_all
  on public.ingestion_source_runs for all to service_role using (true) with check (true);
create policy ingestion_raw_documents_service_role_all
  on public.ingestion_raw_documents for all to service_role using (true) with check (true);
create policy ingestion_normalized_documents_service_role_all
  on public.ingestion_normalized_documents for all to service_role using (true) with check (true);
create policy ingestion_candidates_service_role_all
  on public.ingestion_candidates for all to service_role using (true) with check (true);
create policy ingestion_duplicate_links_service_role_all
  on public.ingestion_duplicate_links for all to service_role using (true) with check (true);
create policy ingestion_processing_steps_service_role_all
  on public.ingestion_processing_steps for all to service_role using (true) with check (true);
create policy ingestion_prompt_versions_service_role_all
  on public.ingestion_prompt_versions for all to service_role using (true) with check (true);
create policy ingestion_migration_ledger_service_role_all
  on public.ingestion_migration_ledger for all to service_role using (true) with check (true);

revoke all on public.ingestion_sources, public.ingestion_source_runs,
  public.ingestion_raw_documents, public.ingestion_normalized_documents,
  public.ingestion_candidates, public.ingestion_duplicate_links,
  public.ingestion_processing_steps, public.ingestion_prompt_versions,
  public.ingestion_migration_ledger from anon, authenticated;
grant select, insert, update, delete on public.ingestion_sources, public.ingestion_source_runs,
  public.ingestion_raw_documents, public.ingestion_normalized_documents,
  public.ingestion_candidates, public.ingestion_duplicate_links,
  public.ingestion_processing_steps, public.ingestion_prompt_versions,
  public.ingestion_migration_ledger to service_role;

insert into public.ingestion_prompt_versions (
  id, task, version, provider, model, system_prompt, output_schema, status, activated_at
) values (
  'content-analysis:v1',
  'content-analysis',
  1,
  'openai',
  'gpt-5.6-luna',
  'Проанализируй материал об Аргентине для редакции туристического портала. Не копируй исходник и не публикуй автоматически. Верни краткое резюме, категории, географию, сущности, признаки риска, актуальность и предложенный раздел сайта. Сохраняй осторожность для виз, законов, цен, расписаний, медицины и безопасности.',
  '{"type":"object","required":["summary","category","tags","province","city","entities","flags","freshnessScore","suggestedTarget"],"additionalProperties":false}',
  'active',
  now()
) on conflict (id) do nothing;

update public.admin_role_presets
set capabilities = (
  select array_agg(distinct capability order by capability)
  from unnest(
    capabilities || array[
      'sources.view', 'sources.create', 'sources.edit', 'sources.enable',
      'sources.disable', 'sources.run', 'ingestion_runs.view',
      'ingestion_runs.retry', 'processing_queue.view', 'processing_queue.manage',
      'moderation.view', 'moderation.approve', 'moderation.reject',
      'moderation.publish', 'prompts.view', 'ingestion_audit.view'
    ]::text[]
  ) as capability
)
where id = 'content_editor';

comment on table public.ingestion_sources is
  'Single operational registry for Argentina Travel ingestion; connection_config never contains secret values.';
comment on table public.ingestion_raw_documents is
  'Immutable restricted source material retained for provenance and reprocessing, never served publicly.';
comment on table public.ingestion_candidates is
  'Human moderation queue; ingestion and AI cannot publish directly.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ingestion-raw',
  'ingestion-raw',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
