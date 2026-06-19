-- Phase E38: Site search v2 — Postgres full-text search index
-- Apply via: npm run supabase:migrate

create table if not exists public.search_documents (
  id text primary key,
  slug text not null,
  kind text not null,
  title text not null,
  description text,
  body_text text not null default '',
  url text not null,
  published_at timestamptz,
  search_vector tsvector generated always as (
    setweight(to_tsvector('russian', coalesce(title, '')), 'A')
    || setweight(to_tsvector('russian', coalesce(body_text, '')), 'B')
    || setweight(to_tsvector('simple', coalesce(description, '')), 'C')
  ) stored,
  updated_at timestamptz not null default now()
);

create index if not exists search_documents_vector_idx
  on public.search_documents using gin (search_vector);

create index if not exists search_documents_kind_idx
  on public.search_documents (kind);

create index if not exists search_documents_published_at_idx
  on public.search_documents (published_at desc nulls last);

drop trigger if exists search_documents_set_updated_at on public.search_documents;
create trigger search_documents_set_updated_at
  before update on public.search_documents
  for each row execute function public.set_updated_at();

comment on table public.search_documents is 'Full-text search index for public site content (E38)';

-- Ranked search RPC — websearch_to_tsquery handles natural language queries
create or replace function public.search_site_documents(
  query_text text,
  filter_kind text default null,
  result_limit integer default 20
)
returns table (
  id text,
  slug text,
  kind text,
  title text,
  description text,
  url text,
  published_at timestamptz,
  rank real
)
language sql
stable
as $$
  select
    sd.id,
    sd.slug,
    sd.kind,
    sd.title,
    sd.description,
    sd.url,
    sd.published_at,
    ts_rank(sd.search_vector, q)::real as rank
  from public.search_documents sd,
    websearch_to_tsquery('russian', query_text) q
  where sd.search_vector @@ q
    and (filter_kind is null or sd.kind = filter_kind)
  order by rank desc, sd.published_at desc nulls last, sd.title
  limit greatest(1, least(result_limit, 50));
$$;

grant execute on function public.search_site_documents(text, text, integer) to anon, authenticated;

alter table public.search_documents enable row level security;

drop policy if exists "search_documents_select_public" on public.search_documents;
create policy "search_documents_select_public"
  on public.search_documents for select
  to anon, authenticated
  using (true);
