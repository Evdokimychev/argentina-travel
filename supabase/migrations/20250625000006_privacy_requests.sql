-- E80: GDPR delete requests queue

create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  request_type text not null default 'delete'
    check (request_type in ('delete')),
  status text not null default 'pending'
    check (status in ('pending', 'in_review', 'completed', 'rejected')),
  reason text,
  metadata jsonb not null default '{}',
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid references public.profiles (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.privacy_requests is
  'Запросы пользователей на удаление персональных данных (очередь операций).';

create index if not exists privacy_requests_status_requested_at_idx
  on public.privacy_requests (status, requested_at desc);

create index if not exists privacy_requests_user_id_idx
  on public.privacy_requests (user_id, requested_at desc);

drop trigger if exists privacy_requests_set_updated_at on public.privacy_requests;
create trigger privacy_requests_set_updated_at
  before update on public.privacy_requests
  for each row execute function public.set_updated_at();

alter table public.privacy_requests enable row level security;

drop policy if exists "privacy_requests_owner_insert" on public.privacy_requests;
create policy "privacy_requests_owner_insert"
  on public.privacy_requests
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "privacy_requests_owner_select" on public.privacy_requests;
create policy "privacy_requests_owner_select"
  on public.privacy_requests
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "privacy_requests_service_all" on public.privacy_requests;
create policy "privacy_requests_service_all"
  on public.privacy_requests
  for all
  to service_role
  using (true)
  with check (true);
