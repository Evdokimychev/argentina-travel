-- E70: Public API partner keys
-- Apply via: npm run supabase:migrate

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  key_hash text not null unique,
  key_prefix text not null,
  label text not null,
  partner_name text,
  organizer_id uuid references public.profiles (id) on delete set null,
  scopes text[] not null default array['tours:read', 'excursions:read']::text[],
  rate_limit_per_minute integer not null default 60 check (rate_limit_per_minute between 1 and 600),
  is_active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz,
  last_used_at timestamptz
);

create index if not exists api_keys_active_idx on public.api_keys (is_active) where is_active = true;
create index if not exists api_keys_organizer_idx on public.api_keys (organizer_id) where organizer_id is not null;
create index if not exists api_keys_prefix_idx on public.api_keys (key_prefix);

drop trigger if exists api_keys_set_updated_at on public.api_keys;
create trigger api_keys_set_updated_at
  before update on public.api_keys
  for each row execute function public.set_updated_at();

alter table public.api_keys enable row level security;

drop policy if exists "api_keys_select_settings" on public.api_keys;
create policy "api_keys_select_settings"
  on public.api_keys for select
  to authenticated
  using (public.is_admin_with('system.settings'));

comment on table public.api_keys is 'Partner/public API keys — validated server-side via key_hash; writes via service role only';
