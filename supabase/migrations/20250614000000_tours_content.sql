-- Phase 4: Published tours content (CMS mirror for public catalog)
-- Apply via: npm run supabase:migrate

create table if not exists public.tours (
  id text primary key,
  slug text not null unique,
  owner_user_id text not null,
  status text not null default 'draft',
  title text not null,
  listing jsonb,
  payload jsonb not null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tours_status_check check (
    status in ('draft', 'published', 'archived')
  )
);

create index if not exists tours_slug_idx on public.tours (slug);
create index if not exists tours_owner_user_id_idx on public.tours (owner_user_id);
create index if not exists tours_status_idx on public.tours (status);
create index if not exists tours_published_at_idx on public.tours (published_at desc nulls last);
create index if not exists tours_created_at_idx on public.tours (created_at desc);

drop trigger if exists tours_set_updated_at on public.tours;
create trigger tours_set_updated_at
  before update on public.tours
  for each row execute function public.set_updated_at();

comment on table public.tours is 'Published tour catalog mirror — canonical Tour JSON in payload';

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.tours enable row level security;

drop policy if exists "tours_select_published" on public.tours;
create policy "tours_select_published"
  on public.tours for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "tours_select_owner" on public.tours;
create policy "tours_select_owner"
  on public.tours for select
  to authenticated
  using (owner_user_id = auth.uid()::text);

drop policy if exists "tours_insert_owner" on public.tours;
create policy "tours_insert_owner"
  on public.tours for insert
  to authenticated
  with check (owner_user_id = auth.uid()::text);

drop policy if exists "tours_update_owner" on public.tours;
create policy "tours_update_owner"
  on public.tours for update
  to authenticated
  using (owner_user_id = auth.uid()::text)
  with check (owner_user_id = auth.uid()::text);

drop policy if exists "tours_delete_owner" on public.tours;
create policy "tours_delete_owner"
  on public.tours for delete
  to authenticated
  using (owner_user_id = auth.uid()::text);
