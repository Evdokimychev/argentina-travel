-- E86: Content freshness metadata for immigration/visa materials

create table if not exists public.content_freshness (
  id uuid primary key default gen_random_uuid(),
  doc_slug text not null,
  doc_type text not null
    check (doc_type in ('legal', 'blog', 'guide', 'destination', 'place')),
  last_verified_at timestamptz not null,
  next_review_at timestamptz not null,
  owner text not null default 'Редакция контента',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (doc_slug, doc_type)
);

comment on table public.content_freshness is
  'Метаданные проверки актуальности контента (E86).';

create index if not exists content_freshness_next_review_idx
  on public.content_freshness (next_review_at asc, doc_type asc);

create index if not exists content_freshness_doc_type_idx
  on public.content_freshness (doc_type, last_verified_at desc);

drop trigger if exists content_freshness_set_updated_at on public.content_freshness;
create trigger content_freshness_set_updated_at
  before update on public.content_freshness
  for each row execute function public.set_updated_at();

alter table public.content_freshness enable row level security;

drop policy if exists "content_freshness_public_select" on public.content_freshness;
create policy "content_freshness_public_select"
  on public.content_freshness
  for select
  to anon, authenticated
  using (true);

drop policy if exists "content_freshness_service_all" on public.content_freshness;
create policy "content_freshness_service_all"
  on public.content_freshness
  for all
  to service_role
  using (true)
  with check (true);
