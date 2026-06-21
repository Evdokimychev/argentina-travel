-- E109: URL redirects CMS (Phase D3 — Payload plugin-redirects pattern)
-- Apply via: npm run supabase:migrate

create table if not exists public.url_redirects (
  id uuid primary key default gen_random_uuid(),
  from_path text not null,
  to_path text not null,
  status_code smallint not null default 301,
  enabled boolean not null default true,
  note text,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint url_redirects_from_path_unique unique (from_path),
  constraint url_redirects_status_code_check check (status_code in (301, 302, 307, 308)),
  constraint url_redirects_from_path_format check (char_length(from_path) > 0 and from_path like '/%'),
  constraint url_redirects_to_path_format check (
    char_length(to_path) > 0
    and (to_path like '/%' or to_path like 'http://%' or to_path like 'https://%')
  )
);

create index if not exists url_redirects_enabled_from_idx
  on public.url_redirects (from_path)
  where enabled = true;

drop trigger if exists url_redirects_set_updated_at on public.url_redirects;
create trigger url_redirects_set_updated_at
  before update on public.url_redirects
  for each row execute function public.set_updated_at();

alter table public.url_redirects enable row level security;

comment on table public.url_redirects is 'CMS-managed HTTP redirects (301/302/307/308) — service role only';
