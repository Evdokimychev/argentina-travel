-- Phase E9: CMS foundation — content documents, revisions, default site settings
-- Apply via: npm run supabase:migrate

create table if not exists public.content_documents (
  id text primary key,
  doc_type text not null,
  slug text not null,
  locale text not null default 'ru',
  title text not null,
  status text not null default 'draft',
  body jsonb not null default '{}',
  seo jsonb not null default '{}',
  published_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_documents_status_check check (
    status in ('draft', 'published', 'archived')
  ),
  constraint content_documents_slug_locale_unique unique (slug, locale, doc_type)
);

create index if not exists content_documents_type_status_idx
  on public.content_documents (doc_type, status);

drop trigger if exists content_documents_set_updated_at on public.content_documents;
create trigger content_documents_set_updated_at
  before update on public.content_documents
  for each row execute function public.set_updated_at();

create table if not exists public.content_revisions (
  id uuid primary key default gen_random_uuid(),
  document_id text not null references public.content_documents (id) on delete cascade,
  revision_number integer not null,
  title text not null,
  body jsonb not null default '{}',
  seo jsonb not null default '{}',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint content_revisions_doc_rev_unique unique (document_id, revision_number)
);

create index if not exists content_revisions_document_idx
  on public.content_revisions (document_id, revision_number desc);

insert into public.site_settings (key, value)
values
  (
    'site.legal',
    '{"companyName":"","inn":"","ogrn":"","address":"","supportEmail":"hello@goargentina.ru"}'::jsonb
  ),
  (
    'site.features',
    '{"maintenanceMode":false,"allowOrganizerSignup":true}'::jsonb
  )
on conflict (key) do nothing;

alter table public.content_documents enable row level security;
alter table public.content_revisions enable row level security;

drop policy if exists "content_documents_select_staff" on public.content_documents;
create policy "content_documents_select_staff"
  on public.content_documents for select
  to authenticated
  using (public.is_admin_with('content.edit'));

drop policy if exists "content_revisions_select_staff" on public.content_revisions;
create policy "content_revisions_select_staff"
  on public.content_revisions for select
  to authenticated
  using (public.is_admin_with('content.edit'));

comment on table public.content_documents is 'CMS documents — blog, guide, legal overrides (v1.2)';
comment on table public.content_revisions is 'Immutable revision history for content_documents';
