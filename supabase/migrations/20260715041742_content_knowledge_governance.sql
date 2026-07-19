-- Content knowledge governance: sources, claims, media rights, dynamic facts,
-- relations, widgets and a database-enforced publication gate.

alter table public.content_documents
  add column if not exists workflow_stage text not null default 'draft',
  add column if not exists risk_level text not null default 'low',
  add column if not exists reviewer_id uuid references public.profiles (id) on delete set null,
  add column if not exists last_fact_checked_at timestamptz,
  add column if not exists next_review_at timestamptz,
  add column if not exists last_substantive_update_at timestamptz,
  add column if not exists schema_version integer not null default 1;

alter table public.content_documents drop constraint if exists content_documents_workflow_stage_check;
alter table public.content_documents add constraint content_documents_workflow_stage_check check (
  workflow_stage in (
    'draft', 'research', 'fact_check', 'editorial_review', 'legal_review',
    'media_review', 'ready', 'scheduled', 'published', 'stale', 'archived'
  )
);
alter table public.content_documents drop constraint if exists content_documents_risk_level_check;
alter table public.content_documents add constraint content_documents_risk_level_check check (
  risk_level in ('low', 'medium', 'high', 'critical')
);

update public.content_documents
set workflow_stage = case status
  when 'published' then 'published'
  when 'scheduled' then 'scheduled'
  when 'archived' then 'archived'
  else 'draft'
end
where workflow_stage = 'draft';

create index if not exists content_documents_governance_queue_idx
  on public.content_documents (workflow_stage, risk_level, next_review_at);

create table if not exists public.content_sources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  authority text not null,
  url text not null,
  source_type text not null,
  jurisdiction text,
  language text not null default 'es',
  published_at timestamptz,
  source_updated_at timestamptz,
  checked_at timestamptz not null,
  accessed_at timestamptz not null default now(),
  content_hash text,
  archive_reference text,
  trust_level text not null default 'primary',
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_sources_url_unique unique (url),
  constraint content_sources_url_check check (url ~ '^https://'),
  constraint content_sources_trust_level_check check (
    trust_level in ('primary', 'international', 'commercial_primary', 'research', 'journalism', 'community')
  ),
  constraint content_sources_status_check check (status in ('active', 'unavailable', 'superseded', 'review_required'))
);

create table if not exists public.content_source_links (
  content_document_id text not null references public.content_documents (id) on delete cascade,
  source_id uuid not null references public.content_sources (id) on delete restrict,
  section_id text not null default '',
  purpose text not null default 'reference',
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (content_document_id, source_id, section_id),
  constraint content_source_links_purpose_check check (
    purpose in ('reference', 'claim', 'price', 'transport', 'legal_basis', 'media', 'update')
  )
);

create table if not exists public.knowledge_claims (
  id uuid primary key default gen_random_uuid(),
  content_document_id text not null references public.content_documents (id) on delete cascade,
  section_id text not null default '',
  statement text not null,
  locale text not null default 'ru',
  topic text not null,
  risk_level text not null default 'low',
  jurisdiction text,
  source_id uuid not null references public.content_sources (id) on delete restrict,
  effective_from timestamptz,
  effective_to timestamptz,
  last_verified_at timestamptz not null,
  next_review_at timestamptz not null,
  verified_by uuid references public.profiles (id) on delete set null,
  status text not null default 'review_required',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint knowledge_claims_risk_level_check check (risk_level in ('low', 'medium', 'high', 'critical')),
  constraint knowledge_claims_status_check check (
    status in ('draft', 'review_required', 'verified', 'disputed', 'expired', 'superseded')
  ),
  constraint knowledge_claims_review_window_check check (next_review_at > last_verified_at)
);

create table if not exists public.dynamic_facts (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  entity_id text not null,
  label text not null,
  value numeric,
  min_value numeric,
  max_value numeric,
  currency text,
  unit text,
  source_id uuid not null references public.content_sources (id) on delete restrict,
  observed_at timestamptz not null,
  verified_at timestamptz not null,
  expires_at timestamptz not null,
  fetch_method text not null default 'manual',
  fallback text,
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dynamic_facts_range_check check (min_value is null or max_value is null or min_value <= max_value),
  constraint dynamic_facts_expiry_check check (expires_at > observed_at),
  constraint dynamic_facts_status_check check (status in ('active', 'stale', 'error', 'disabled', 'review_required'))
);

create table if not exists public.entity_relations (
  source_entity_id text not null,
  target_entity_id text not null,
  relation_type text not null,
  relevance_score numeric(5, 4) not null default 0.5 check (relevance_score between 0 and 1),
  editorial_priority integer not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (source_entity_id, target_entity_id, relation_type),
  constraint entity_relations_no_self_check check (source_entity_id <> target_entity_id),
  constraint entity_relations_status_check check (status in ('active', 'review_required', 'archived'))
);

create table if not exists public.content_widget_registry (
  id text primary key,
  type text not null,
  purpose text not null,
  owner text not null,
  allowed_content_types text[] not null default '{}',
  required_data jsonb not null default '{}',
  source_requirements jsonb not null default '{}',
  loading_state text not null,
  empty_state text not null,
  error_state text not null,
  stale_state text not null,
  analytics_event text not null,
  accessibility_requirements text not null,
  performance_budget jsonb not null default '{}',
  schema_version integer not null default 1,
  status text not null default 'draft',
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_widget_registry_status_check check (status in ('draft', 'active', 'disabled', 'archived'))
);

create table if not exists public.content_widget_usages (
  content_document_id text not null references public.content_documents (id) on delete cascade,
  widget_id text not null references public.content_widget_registry (id) on delete restrict,
  section_id text not null default '',
  config jsonb not null default '{}',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (content_document_id, widget_id, section_id),
  constraint content_widget_usages_status_check check (status in ('active', 'disabled', 'review_required'))
);

alter table public.cms_media_assets
  add column if not exists original_url text,
  add column if not exists source_platform text,
  add column if not exists source_page_url text,
  add column if not exists creator text,
  add column if not exists creator_profile_url text,
  add column if not exists license text,
  add column if not exists license_url text,
  add column if not exists attribution_text text,
  add column if not exists accessed_at timestamptz,
  add column if not exists rights_verified_at timestamptz,
  add column if not exists rights_verified_by uuid references public.profiles (id) on delete set null,
  add column if not exists location_entity_id text,
  add column if not exists capture_date date,
  add column if not exists caption_ru text,
  add column if not exists focal_point jsonb not null default '{"x":0.5,"y":0.5}',
  add column if not exists content_hash text,
  add column if not exists rights_status text not null default 'review_required';

alter table public.cms_media_assets drop constraint if exists cms_media_assets_rights_status_check;
alter table public.cms_media_assets add constraint cms_media_assets_rights_status_check check (
  rights_status in ('review_required', 'verified', 'restricted', 'expired', 'rejected')
);
create index if not exists cms_media_assets_rights_queue_idx
  on public.cms_media_assets (rights_status, rights_verified_at);
create unique index if not exists cms_media_assets_content_hash_unique_idx
  on public.cms_media_assets (content_hash) where content_hash is not null;

create table if not exists public.content_media_usages (
  content_document_id text not null references public.content_documents (id) on delete cascade,
  media_asset_id text not null references public.cms_media_assets (id) on delete restrict,
  role text not null,
  section_id text not null default '',
  created_at timestamptz not null default now(),
  primary key (content_document_id, media_asset_id, role, section_id)
);

create index if not exists content_source_links_source_idx on public.content_source_links (source_id);
create index if not exists knowledge_claims_document_status_idx on public.knowledge_claims (content_document_id, status, next_review_at);
create index if not exists knowledge_claims_source_idx on public.knowledge_claims (source_id);
create index if not exists dynamic_facts_entity_kind_idx on public.dynamic_facts (entity_id, kind, status, expires_at);
create index if not exists entity_relations_target_idx on public.entity_relations (target_entity_id, relation_type, status);
create index if not exists content_widget_usages_widget_idx on public.content_widget_usages (widget_id, status);
create index if not exists content_media_usages_asset_idx on public.content_media_usages (media_asset_id);

drop trigger if exists content_sources_set_updated_at on public.content_sources;
create trigger content_sources_set_updated_at before update on public.content_sources
  for each row execute function public.set_updated_at();
drop trigger if exists knowledge_claims_set_updated_at on public.knowledge_claims;
create trigger knowledge_claims_set_updated_at before update on public.knowledge_claims
  for each row execute function public.set_updated_at();
drop trigger if exists dynamic_facts_set_updated_at on public.dynamic_facts;
create trigger dynamic_facts_set_updated_at before update on public.dynamic_facts
  for each row execute function public.set_updated_at();
drop trigger if exists entity_relations_set_updated_at on public.entity_relations;
create trigger entity_relations_set_updated_at before update on public.entity_relations
  for each row execute function public.set_updated_at();
drop trigger if exists content_widget_registry_set_updated_at on public.content_widget_registry;
create trigger content_widget_registry_set_updated_at before update on public.content_widget_registry
  for each row execute function public.set_updated_at();
drop trigger if exists content_widget_usages_set_updated_at on public.content_widget_usages;
create trigger content_widget_usages_set_updated_at before update on public.content_widget_usages
  for each row execute function public.set_updated_at();

alter table public.content_sources enable row level security;
alter table public.content_source_links enable row level security;
alter table public.knowledge_claims enable row level security;
alter table public.dynamic_facts enable row level security;
alter table public.entity_relations enable row level security;
alter table public.content_widget_registry enable row level security;
alter table public.content_widget_usages enable row level security;
alter table public.content_media_usages enable row level security;

create policy "content_sources_public_select" on public.content_sources for select to anon, authenticated
  using (status = 'active');
create policy "knowledge_claims_public_select" on public.knowledge_claims for select to anon, authenticated
  using (status = 'verified' and next_review_at > now());
create policy "dynamic_facts_public_select" on public.dynamic_facts for select to anon, authenticated
  using (status = 'active' and expires_at > now());
create policy "entity_relations_public_select" on public.entity_relations for select to anon, authenticated
  using (status = 'active');
create policy "content_widget_registry_public_select" on public.content_widget_registry for select to anon, authenticated
  using (status = 'active');

create policy "content_governance_staff_sources" on public.content_sources for all to authenticated
  using (public.is_admin_with('content.edit')) with check (public.is_admin_with('content.edit'));
create policy "content_governance_staff_source_links" on public.content_source_links for all to authenticated
  using (public.is_admin_with('content.edit')) with check (public.is_admin_with('content.edit'));
create policy "content_governance_staff_claims" on public.knowledge_claims for all to authenticated
  using (public.is_admin_with('content.edit')) with check (public.is_admin_with('content.edit'));
create policy "content_governance_staff_dynamic_facts" on public.dynamic_facts for all to authenticated
  using (public.is_admin_with('content.edit')) with check (public.is_admin_with('content.edit'));
create policy "content_governance_staff_relations" on public.entity_relations for all to authenticated
  using (public.is_admin_with('content.edit')) with check (public.is_admin_with('content.edit'));
create policy "content_governance_staff_widgets" on public.content_widget_registry for all to authenticated
  using (public.is_admin_with('content.edit')) with check (public.is_admin_with('content.edit'));
create policy "content_governance_staff_widget_usages" on public.content_widget_usages for all to authenticated
  using (public.is_admin_with('content.edit')) with check (public.is_admin_with('content.edit'));
create policy "content_governance_staff_media_usages" on public.content_media_usages for all to authenticated
  using (public.is_admin_with('content.edit')) with check (public.is_admin_with('content.edit'));

revoke all on public.content_sources, public.content_source_links, public.knowledge_claims,
  public.dynamic_facts, public.entity_relations, public.content_widget_registry,
  public.content_widget_usages, public.content_media_usages from anon, authenticated;
grant select on public.content_sources, public.knowledge_claims, public.dynamic_facts,
  public.entity_relations, public.content_widget_registry to anon, authenticated;
grant select, insert, update, delete on public.content_sources, public.content_source_links,
  public.knowledge_claims, public.dynamic_facts, public.entity_relations,
  public.content_widget_registry, public.content_widget_usages, public.content_media_usages
  to authenticated;
grant all on public.content_sources, public.content_source_links, public.knowledge_claims,
  public.dynamic_facts, public.entity_relations, public.content_widget_registry,
  public.content_widget_usages, public.content_media_usages to service_role;

create or replace function public.content_publication_gate(p_document_id text)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  doc public.content_documents%rowtype;
  errors text[] := '{}';
  source_count integer := 0;
  claim_count integer := 0;
  invalid_claim_count integer := 0;
  invalid_media_count integer := 0;
begin
  select * into doc from public.content_documents where id = p_document_id;
  if not found then
    return jsonb_build_object('ok', false, 'errors', jsonb_build_array('document_not_found'));
  end if;

  select count(*) into source_count
  from public.content_source_links link
  join public.content_sources source on source.id = link.source_id
  where link.content_document_id = p_document_id
    and source.status = 'active'
    and source.checked_at is not null;

  if btrim(doc.title) = '' then errors := array_append(errors, 'missing_title'); end if;
  if doc.body = '{}'::jsonb then errors := array_append(errors, 'missing_body'); end if;
  if source_count = 0 then errors := array_append(errors, 'missing_active_source'); end if;
  if doc.last_fact_checked_at is null then errors := array_append(errors, 'missing_fact_check_date'); end if;
  if doc.next_review_at is null or doc.next_review_at <= now() then errors := array_append(errors, 'review_due'); end if;
  if doc.workflow_stage not in ('ready', 'scheduled', 'published') then errors := array_append(errors, 'workflow_not_ready'); end if;

  if doc.risk_level in ('high', 'critical') then
    if doc.reviewer_id is null then errors := array_append(errors, 'missing_reviewer'); end if;
    select count(*), count(*) filter (
      where claim.status <> 'verified'
        or claim.next_review_at <= now()
        or claim.verified_by is null
        or source.status <> 'active'
    )
    into claim_count, invalid_claim_count
    from public.knowledge_claims claim
    join public.content_sources source on source.id = claim.source_id
    where claim.content_document_id = p_document_id;
    if claim_count = 0 then errors := array_append(errors, 'missing_verified_claims'); end if;
    if invalid_claim_count > 0 then errors := array_append(errors, 'invalid_or_stale_claims'); end if;
  end if;

  select count(*) into invalid_media_count
  from public.content_media_usages usage
  join public.cms_media_assets media on media.id = usage.media_asset_id
  where usage.content_document_id = p_document_id
    and (
      media.rights_status <> 'verified'
      or media.rights_verified_at is null
      or nullif(media.creator, '') is null
      or nullif(media.license, '') is null
      or nullif(media.source_page_url, '') is null
      or nullif(media.alt, '') is null
    );
  if invalid_media_count > 0 then errors := array_append(errors, 'media_rights_incomplete'); end if;

  return jsonb_build_object(
    'ok', cardinality(errors) = 0,
    'errors', to_jsonb(errors),
    'sourceCount', source_count,
    'claimCount', claim_count,
    'invalidMediaCount', invalid_media_count
  );
end;
$$;

revoke all on function public.content_publication_gate(text) from public, anon, authenticated;
grant execute on function public.content_publication_gate(text) to service_role;

create or replace function public.enforce_content_publication_gate()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  source_count integer := 0;
  claim_count integer := 0;
  invalid_claim_count integer := 0;
  invalid_media_count integer := 0;
begin
  if new.status not in ('published', 'scheduled') then return new; end if;
  if tg_op = 'INSERT' then
    raise exception 'content_publication_gate:new_documents_must_start_as_draft';
  end if;
  if btrim(new.title) = '' or new.body = '{}'::jsonb then
    raise exception 'content_publication_gate:missing_title_or_body';
  end if;
  if new.last_fact_checked_at is null or new.next_review_at is null or new.next_review_at <= now() then
    raise exception 'content_publication_gate:fact_check_or_review_due';
  end if;
  if new.workflow_stage not in ('ready', 'scheduled', 'published') then
    raise exception 'content_publication_gate:workflow_not_ready';
  end if;
  select count(*) into source_count
  from public.content_source_links link
  join public.content_sources source on source.id = link.source_id
  where link.content_document_id = new.id
    and source.status = 'active'
    and source.checked_at is not null;
  if source_count = 0 then
    raise exception 'content_publication_gate:missing_active_source';
  end if;
  if new.risk_level in ('high', 'critical') then
    if new.reviewer_id is null then
      raise exception 'content_publication_gate:missing_reviewer';
    end if;
    select count(*), count(*) filter (
      where claim.status <> 'verified'
        or claim.next_review_at <= now()
        or claim.verified_by is null
        or source.status <> 'active'
    )
    into claim_count, invalid_claim_count
    from public.knowledge_claims claim
    join public.content_sources source on source.id = claim.source_id
    where claim.content_document_id = new.id;
    if claim_count = 0 or invalid_claim_count > 0 then
      raise exception 'content_publication_gate:missing_or_invalid_claims';
    end if;
  end if;
  select count(*) into invalid_media_count
  from public.content_media_usages usage
  join public.cms_media_assets media on media.id = usage.media_asset_id
  where usage.content_document_id = new.id
    and (
      media.rights_status <> 'verified'
      or media.rights_verified_at is null
      or nullif(media.creator, '') is null
      or nullif(media.license, '') is null
      or nullif(media.source_page_url, '') is null
      or nullif(media.alt, '') is null
    );
  if invalid_media_count > 0 then
    raise exception 'content_publication_gate:media_rights_incomplete';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_content_publication_gate() from public, anon, authenticated;
grant execute on function public.enforce_content_publication_gate() to service_role;

drop trigger if exists content_documents_publication_gate_insert on public.content_documents;
create trigger content_documents_publication_gate_insert
  before insert on public.content_documents
  for each row execute function public.enforce_content_publication_gate();
drop trigger if exists content_documents_publication_gate_update on public.content_documents;
create trigger content_documents_publication_gate_update
  before update of status, title, body, workflow_stage, risk_level, reviewer_id,
    last_fact_checked_at, next_review_at on public.content_documents
  for each row execute function public.enforce_content_publication_gate();

insert into public.feature_flags (key, enabled, rollout_percent, metadata)
values (
  'content_governance_v1', false, 0,
  '{"description":"Редакционные источники, claims, dynamic facts и publication gate","owner":"Редакция контента"}'::jsonb
)
on conflict (key) do nothing;

comment on table public.content_sources is 'Registry of external sources used by public content';
comment on table public.knowledge_claims is 'Source-backed claims with verification and expiry';
comment on table public.dynamic_facts is 'Expiring prices, rates, schedules and other dynamic facts';
comment on table public.entity_relations is 'Editorial knowledge graph between canonical entities';
comment on table public.content_widget_registry is 'Governed registry of content widgets and their required states';
