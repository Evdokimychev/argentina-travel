-- Follow-up for the already deployed native ingestion baseline. Keep the
-- original migration immutable and add update proposals as an additive layer.

alter table public.ingestion_candidates
  add column related_cms_document_id text references public.content_documents (id) on delete set null,
  add column related_content_score numeric(5,4);

create table public.ingestion_update_proposals (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null unique references public.ingestion_candidates (id) on delete cascade,
  content_document_id text not null references public.content_documents (id) on delete cascade,
  base_version integer not null,
  proposed_title text not null,
  proposed_body jsonb not null,
  diff jsonb not null default '{}',
  status text not null default 'pending',
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  applied_revision_id uuid references public.content_revisions (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ingestion_update_proposals_status_check check (
    status in ('pending', 'accepted', 'rejected', 'applied', 'superseded')
  ),
  constraint ingestion_update_proposals_version_check check (base_version > 0)
);

create index ingestion_update_proposals_document_idx
  on public.ingestion_update_proposals (content_document_id, status, created_at desc);

create trigger ingestion_update_proposals_set_updated_at
  before update on public.ingestion_update_proposals
  for each row execute function public.set_updated_at();

alter table public.ingestion_update_proposals enable row level security;

create policy ingestion_update_proposals_service_role_all
  on public.ingestion_update_proposals for all to service_role
  using (true) with check (true);

revoke all on public.ingestion_update_proposals from public, anon, authenticated;
grant select, insert, update, delete on public.ingestion_update_proposals to service_role;

update public.ingestion_prompt_versions
set system_prompt = 'Проанализируй материал об Аргентине для редакции туристического портала. Не копируй исходник и не публикуй автоматически. Верни краткое резюме, категории, географию, сущности, признаки риска, актуальность и предложенный раздел сайта. Для русского текста верни исходные title/body и translationApplied=false; для испанского или английского подготовь точный русский перевод и translationApplied=true. Сохраняй осторожность для виз, законов, цен, расписаний, медицины и безопасности.'
where id = 'content-analysis:v1';

comment on table public.ingestion_update_proposals is
  'Human-reviewed proposals for updating an existing CMS document; never applied automatically.';
