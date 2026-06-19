-- E92: Server-side favorites (tours + excursions)

create table if not exists public.user_favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_type text not null check (item_type in ('tour', 'excursion')),
  item_id text not null,
  item_slug text not null,
  created_at timestamptz not null default now(),
  constraint user_favorites_item_id_check check (length(trim(item_id)) > 0),
  constraint user_favorites_item_slug_check check (length(trim(item_slug)) > 0),
  constraint user_favorites_unique primary key (user_id, item_type, item_slug)
);

create index if not exists user_favorites_user_created_idx
  on public.user_favorites (user_id, created_at desc);

alter table public.user_favorites enable row level security;

drop policy if exists "user_favorites_select_own" on public.user_favorites;
create policy "user_favorites_select_own"
  on public.user_favorites for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "user_favorites_insert_own" on public.user_favorites;
create policy "user_favorites_insert_own"
  on public.user_favorites for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "user_favorites_delete_own" on public.user_favorites;
create policy "user_favorites_delete_own"
  on public.user_favorites for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "user_favorites_service_all" on public.user_favorites;
create policy "user_favorites_service_all"
  on public.user_favorites for all
  to service_role
  using (true)
  with check (true);

comment on table public.user_favorites is
  'Избранное пользователя (туры и экскурсии), синхронизируемое между устройствами.';
